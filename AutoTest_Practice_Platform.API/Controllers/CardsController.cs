using AutoTest_Practice_Platform.API.Contracts;
using AutoTest_Practice_Platform.API.Data;
using AutoTest_Practice_Platform.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static AutoTest_Practice_Platform.API.Contracts.CardContracts;

namespace AutoTest_Practice_Platform.API.Controllers
{
    [ApiController]
    [Route("api/cards")]
    [AllowAnonymous]
    public sealed class CardsController(AppDbContext db) : ControllerBase
    {

        // 1. 检索卡片 (支持根据卡号和有效期模糊检索)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CardResponse>>> GetAll([FromQuery] string? cardNumber, [FromQuery] string? expiryDate, [FromQuery] bool? isDeleted)
        {
            var query = db.Cards.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(cardNumber))
                query = query.Where(x => x.CardNumber.Contains(cardNumber));

            if (!string.IsNullOrWhiteSpace(expiryDate))
                query = query.Where(x => x.ExpiryDate.Contains(expiryDate));

            if (isDeleted.HasValue)
                query = query.Where(x => x.IsDeleted == isDeleted.Value);

            // 先查出数据在内存中排序，避免复杂的三元表达式导致 EF 翻译 SQL 失败
            var data = await query.ToListAsync();

            var unDeletedResult = data
                            .Where(x => !x.IsDeleted)
                            .OrderBy(x => x.CreatedAt)
                            .Select(x => CardResponse.From(x))
                            .ToList();

            var DeletedResult = data
                            .Where(x => x.IsDeleted)
                            .OrderBy(x => x.UpdatedAt)
                            .Select(x => CardResponse.From(x))
                            .ToList();

            var result = unDeletedResult.Concat(DeletedResult).ToList();

            return Ok(result);
        }

        // 2. 新增卡片
        [HttpPost]
        public async Task<ActionResult<CardResponse>> Create(CreateCardRequest request)
        {
            var card = new CardItem
            {
                CardNumber = request.CardNumber,
                ExpiryDate = request.ExpiryDate,
                Ccv = request.Ccv,
                IsDeleted = request.IsDeleted
            };

            db.Cards.Add(card);
            await db.SaveChangesAsync();

            return Ok(CardResponse.From(card));
        }

        // 3. 编辑卡片
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<CardResponse>> Update(Guid id, UpdateCardRequest request)
        {
            var card = await db.Cards.FindAsync(id);
            if (card is null) return NotFound();

            card.CardNumber = request.CardNumber;
            card.ExpiryDate = request.ExpiryDate;
            card.Ccv = request.Ccv;
            card.IsDeleted = request.IsDeleted;
            card.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();
            return Ok(CardResponse.From(card));
        }

        // 4. 逻辑删除卡片
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var card = await db.Cards.FindAsync(id);
            if (card is null) return NotFound();

            // 逻辑删除：只改状态，不从数据库物理抹除
            card.IsDeleted = true;
            card.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();
            return NoContent();
        }

        // 5. 获取最早创建的一条未使用卡片 (供自动化测试脚本提取数据使用)
        [HttpGet("getOne")]
        public async Task<ActionResult<string>> GetOne()
        {
            var card = await db.Cards
                .Where(x => !x.IsDeleted) // 过滤出未使用的卡片
                .OrderBy(x => x.CreatedAt) // 按照创建时间升序排序（最先创建的排在前面）
                .FirstOrDefaultAsync();

            if (card is null)
            {
                return NotFound(new { message = "当前数据池中没有未使用的卡片" });
            }

            // 可选业务逻辑：如果该接口是提取数据用的，可以在提取后将其标记为已使用
            // card.IsUsed = true;
            // card.UpdatedAt = DateTimeOffset.UtcNow;
            // await _db.SaveChangesAsync();

            return Ok(CardResponse.From(card));
        }
    }
}