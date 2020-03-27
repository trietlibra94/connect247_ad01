//// connect server
//var serverUrl = "http://localhost:62343/";
//var serverUrl = "http://localhost:8086/";
//var serverUrl = "http://192.168.30.195:8086/";
//var serverUrl = "http://172.23.90.183:81/";
//var serverSIP = "172.23.90.180";

function User() {
    // Thuộc tính
    this.username = '';
    this.password = '';
    this.extention = '';
    this.phone = null;

    // Phải return this thì mới tạo mới được đối tượng
    return this;
}

User.prototype.setInfo = function(username, password, extention) {
    this.username = username;
    this.password = password;
    this.extention = extention;
};

User.prototype.contructorPhone = function(phone) {
    this.phone = phone;
};

var user = new User();

function CallInfor() {
    this.Channel = '';
    this.CallPhoneNumber = '';
}

CallInfor.prototype.contructorCall = function(Channel, CallPhoneNumber) {
    if (Channel != "") {
        this.Channel = Channel;
    }

    if (CallPhoneNumber != "") {
        this.CallPhoneNumber = CallPhoneNumber;
    }
};

CallInfor.prototype.clearCall = function() {
    this.Channel = "";
    this.CallPhoneNumber = "";
};

var callinfor = new CallInfor();

function InforSetting() {
    this.serverUrl = '';
    this.serverSIP = '';
    this.usernameDefault = '';

    return this;
}

InforSetting.prototype.setServerUrl = function(serverUrl) {
    this.serverUrl = serverUrl;
};
InforSetting.prototype.setServerSIP = function(serverSIP) {
    this.serverSIP = serverSIP;
};
InforSetting.prototype.setUsernameDefault = function(usernameDefault) {
    this.usernameDefault = usernameDefault;
};
InforSetting.prototype.setAll = function(serverUrl, serverSIP, usernameDefault) {
    this.serverUrl = serverUrl;
    this.serverSIP = serverSIP;
    this.usernameDefault = usernameDefault;
};

var inforsetting = new InforSetting();