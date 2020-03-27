var SIP = require("sip.js");

var baseCall = class baseCall {
    constructor() {
        this.isMuted = false;
    }
    get id() {
        return this.session ? this.session.id : '-dummy';
    }

    get session() {
        return this._session;
    }
    set session(_session) {
        var $self = this;
        this._session = _session;

        _session.on('terminated', function(message, cause) {
            $self.onDestroy(cause);
            $self.terminated = true;
            $self.onStatusChange('terminated');
        });

        _session.on('progress', function(message, cause) {
            $self.onStatusChange('progress');
        });

        _session.on('accepted', function(message, cause) {
            $self.answered = true;
            $self.onStatusChange('accepted');
        });

        _session.on('directionChanged', function() {
            var direction = _session.sessionDescriptionHandler.getDirection();
            if (direction === 'sendrecv') {
                console.log('Call is not on hold');
                $self.isMuted = false;
                $self.onStatusChange('muted');
            } else {
                console.log('Call is on hold');
                $self.isMuted = true;
                $self.onStatusChange('unmuted');
            }
        });

        _session.on('trackAdded', function() {
            var pc = _session.sessionDescriptionHandler.peerConnection;
            var remoteStream = new MediaStream();
            pc.getReceivers().forEach(function(receiver) {
                remoteStream.addTrack(receiver.track);
            });
            $self.audio.srcObject = remoteStream;
            $self.audio.play().then(() => {}).catch(() => {});
        });
    }

    static fromSession(session, onDestroy) {
        var call = new baseCall();
        call.session = session;
        call.onDestroy = onDestroy || function() {};

        return call;
    }

    addAudio() {
        var audio = document.createElement('audio');
        audio.autoplay = true;
        //audio.style = 'display:none';
        document.body.appendChild(audio);
        this.audio = audio;
    }

    removeAudio() {
        document.body.removeChild(this.audio);
    }

    onStatusChange() {

    }

    answer() {
        this.session.accept({
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                },
            },
        });
    }

    mute(flag) {
        if (flag === undefined) return this.isMuted;
        if (flag) this.session.hold();
        else this.session.unhold();
    }

    transfer(ext) {
        this.session.refer(ext);
    }

    volume(vol) {
        if (vol == undefined) return this.audio.volume * 100;
        this.audio.volume = vol / 100;
    }

    hangup() {
        this.session.terminate();
    }
}

var basePhone = class basePhone {
    constructor(settings) {

        if (SIP === undefined) { throw new Error("SIP.js is not loaded"); }
        if (!settings || !settings.connection || !settings.connection.wss) { throw new Error("Connection settings are not provided") }

        this.settings = settings;

        if (settings.display.ring) {
            var audio = document.createElement('audio');
            audio.autoplay = false;
            audio.src = settings.display.ring;
            audio.loop = true;
            document.body.appendChild(audio);
            this.ring = audio;
        }

        if (settings.display.ringback) {
            var audio = document.createElement('audio');
            audio.autoplay = false;
            audio.src = settings.display.ringback;
            audio.loop = true;
            document.body.appendChild(audio);
            this.ringback = audio;
        }

        var $self = this;
        $self.calls = [];
        $self.call02 = null;

        $self.ua = new SIP.UA({
            uri: settings.connection.identity || 'anonymous@invalid',
            transportOptions: { traceSip: false, wsServers: [settings.connection.wss] },
            sessionDescriptionHandlerFactoryOptions: {
                peerConnectionOptions: {
                    rtcConfiguration: {
                        iceServers: [
                            { urls: ['stun:pbx0.rtclogic.com'] }
                        ]
                    },
                    iceCheckingTimeout: 2000
                }
            },
            register: settings.connection.register,
            password: settings.connection.password,
            hackWssInTransport: true,
            wsServerMaxReconnection: 100
        });

        $self.ua.on('connecting', function(args) {
            $self.onConnecting(args.attempts);
        });
        $self.ua.on('connected', function() {
            $self.onConnect();
        });
        $self.ua.on('disconnected', function() {
            $self.onDisconnect();
        });
        $self.ua.on('registered', function() {
            $self.onRegister();
        });
        $self.ua.on('unregistered', function(response, cause) {
            $self.onUnregister();
        });
        $self.ua.on('registrationFailed', function(cause, response) {
            $self.onRegistrationFailed(cause);
        });
        $self.ua.on('invite', function(session) {
            var call = baseCall.fromSession(session, function() {
                var i = $self.calls.findIndex(function(el, index, array) {
                    return call.id === el.id;
                });
                if (i < 0) { console.warn("Destroyed call was not found in queue"); } else $self.calls.splice(i, 1);
                call.removeAudio();
            });

            $self.call02 = call;

            //console.log(call);

            // //check internal call or inbound/outbound call
            // var numbercall = call.session.assertedIdentity.uri.normal.user;

            // if (numbercall.length <= 6) { // chieu dai extention thap hon hoac bang 6;
            //     call.direction = 'inbound';
            //     call.addAudio();
            //     call.onStatusChange = function() {
            //         if ($self.ring && (call.answered || call.terminated)) {
            //             $self.ring.pause();
            //             $self.ring.currentTime = 0;
            //         }
            //     };
            //     $self.calls.push(call);
            //     $self.onCall(call);

            //     document.getElementById("display_result").innerHTML = "";
            //     document.getElementById("display_time").innerHTML = "";
            //     document.getElementById("display_callnumber").innerHTML = "Internal call... " + numbercall;

            //     $("#infor-control-callnow").removeClass("frame_hide");
            //     $("#btnanswer").removeClass("btnanswer_hide");

            // } else { // chieu dai so dien thoai se nhieu hon 6;
            //     var callinfor = call.session.request.headers.Trietnt;
            //     if (callinfor != undefined) {
            //         if (callinfor[0].raw != null & callinfor[0].raw == "autoanswer=1") {
            //             call.direction = 'inbound';
            //             call.addAudio();
            //             call.onStatusChange = function() {
            //                 if ($self.ring && (call.answered || call.terminated)) {
            //                     $self.ring.pause();
            //                     $self.ring.currentTime = 0;
            //                 }
            //             };
            //             $self.calls.push(call);
            //             $self.onCall(call);

            //             console.log("answer");
            //             call.answer();
            //         }
            //     } else {
            //         call.direction = 'inbound';
            //         call.addAudio();
            //         call.onStatusChange = function() {
            //             if ($self.ring && (call.answered || call.terminated)) {
            //                 $self.ring.pause();
            //                 $self.ring.currentTime = 0;
            //             }
            //         };
            //         $self.calls.push(call);
            //         $self.onCall(call);
            //         if ($self.ring) $self.ring.play();
            //     }
            // }

            var callinfor = call.session.request.headers.Baseoutbound;
            if (callinfor != undefined) {
                if (callinfor[0].raw != null & callinfor[0].raw == "autoanswer=0") {
                    call.direction = 'inbound';
                    call.addAudio();
                    call.onStatusChange = function() {
                        if ($self.ring && (call.answered || call.terminated)) {
                            $self.ring.pause();
                            $self.ring.currentTime = 0;
                        }
                    };
                    $self.calls.push(call);
                    $self.onCall(call);
                    call.answer();
                }
            } else {
                call.direction = 'inbound';
                call.addAudio();
                call.onStatusChange = function() {
                    if ($self.ring && (call.answered || call.terminated)) {
                        $self.ring.pause();
                        $self.ring.currentTime = 0;
                    }
                };
                $self.calls.push(call);
                $self.onCall(call);
                if ($self.ring) $self.ring.play();
            }
        });
    }

    // Methods
    call(number) {
        var $self = this;

        var session = $self.ua.invite(number, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
        });

        var call = baseCall.fromSession(session, function() {
            var i = $self.calls.findIndex(function(el, index, array) {
                return call.id === el.id;
            });
            if (i < 0) { console.warn("Destroyed call was not found in queue"); } else $self.calls.splice(i, 1);
            call.removeAudio();
        });

        call.direction = 'outbound';
        call.addAudio();
        call.onStatusChange = function(status) {
            if (status == 'progress') {
                if ($self.ringback) {
                    $self.ringback.currentTime = 0;
                    $self.ringback.play().then(() => {}).catch(() => {});
                }
            }
            if (status == 'accepted') {
                if ($self.ringback) $self.ringback.pause();
            }
            if (status == 'terminated') {
                if ($self.ringback) $self.ringback.pause();
            }
            //$self.render();
        };

        call.session.on('trackAdded', function() {
            var pc = call.session.sessionDescriptionHandler.peerConnection;
            var remoteStream = new MediaStream();
            pc.getReceivers().forEach(function(receiver) {
                remoteStream.addTrack(receiver.track);
            });
            call.audio.srcObject = remoteStream;
            call.audio.play().then(() => {}).catch(() => {});
        });

        $self.calls.push(call);
        console.log(call);
    }

    resolveName(number) {
        return number;
    }

    // Events
    onConnecting(attempt) {

    }
    onConnect() {

    }
    onDisconnect() {

    }
    onRegister() {

    }
    onUnregister() {

    }
    onRegistrationFailed(cause) {

    }
    onCall(call) {

    }
}