using System.Runtime.Serialization;

namespace AutoTest_Practice_Platform.API.Contracts
{
    public class CardContracts
    {
        public record CreateCardRequest(Guid? Id, string CardNumber, string ExpiryDate, string Ccv, bool IsDeleted = false);
        public record UpdateCardRequest(string CardNumber, string ExpiryDate, string Ccv, bool IsDeleted);

        public record CardResponse(
            Guid Id,
            string CardNumber,
            string ExpiryDate,
            string Ccv,
            string FormattedInfo,
            bool IsDeleted,
            string CreatedAt,
            string? UpdatedAt
        )
        {
            public static CardResponse From(Models.CardItem card)
            {
                // 在这里实现后端拼接逻辑
                var formattedInfo = $"Card Number: {card.CardNumber}\nExpires: {card.ExpiryDate}\nCCV: {card.Ccv}";

                return new CardResponse(
                    card.Id,
                    card.CardNumber,
                    card.ExpiryDate,
                    card.Ccv,
                    formattedInfo,
                    card.IsDeleted,
                    card.CreatedAt.ToOffset(TimeSpan.FromHours(8)).ToString("yyyy-MM-dd HH:mm:ss.fff"),
                    card.UpdatedAt.HasValue
                        ? card.UpdatedAt.Value.ToOffset(TimeSpan.FromHours(8)).ToString("yyyy-MM-dd HH:mm:ss.fff")
                        : null
                );
            }
        }
    }
}
