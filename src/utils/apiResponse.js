class apiResponse {
    constructor(statusCode, data, msg) {
        this.statusCode = statusCode;
        this.data = data;
        this.msg = msg;
        this.success = statusCode < 400;
    }
}

module.exports = apiResponse;
