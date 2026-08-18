namespace AutoTest_Practice_Platform.API.Models
{
    public class CardItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string CardNumber { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty; // 格式如: 12/26
        public string Ccv { get; set; } = string.Empty;

        // 逻辑删除标识
        public bool IsDeleted { get; set; } = false;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; set; }
    }
}
