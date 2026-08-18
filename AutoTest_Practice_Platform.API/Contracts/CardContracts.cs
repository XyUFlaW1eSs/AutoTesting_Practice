namespace AutoTest_Practice_Platform.API.Contracts
{
    public class CardContracts
    {
        public record CreateCardRequest(string CardNumber, string ExpiryDate, string Ccv, bool IsDeleted = false);
        public record UpdateCardRequest(string CardNumber, string ExpiryDate, string Ccv, bool IsDeleted);

        public record CardResponse(
            Guid Id,
            string CardNumber,
            string ExpiryDate,
            string Ccv,
            string FormattedInfo,
            DateTimeOffset CreatedAt
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
                    card.CreatedAt);
            }
        }
    }
}
