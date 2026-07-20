namespace AutoTest_Practice_Platform.API.Models
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Data { get; }
        public string? ErrorMessage { get; }

        // 可选：增加一个错误码字段，方便前端做多语言或精确提示
        // public string? ErrorCode { get; } 

        private Result(bool isSuccess, T? data, string? errorMessage)
        {
            IsSuccess = isSuccess;
            Data = data;
            ErrorMessage = errorMessage;
        }

        public static Result<T> Success(T data) => new(true, data, null);
        public static Result<T> Failure(string errorMessage) => new(false, default, errorMessage);
    }
}