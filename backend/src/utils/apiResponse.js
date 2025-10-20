class ApiResponse {
    constructor(
        statusCode,
        data,
        message,
        errors = []
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        if (statusCode >= 400 && statusCode <= 500) {
            this.errors = errors;
        }
    }
}

export { ApiResponse }