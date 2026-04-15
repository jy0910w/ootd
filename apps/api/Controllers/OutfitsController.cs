using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI.Types;
using OotdPlatform.Api.Data;
using OotdPlatform.Api.Models;
using OotdPlatform.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class OutfitsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GeminiService _geminiService;

    public OutfitsController(AppDbContext context, GeminiService geminiService)
    {
        _context = context;
        _geminiService = geminiService;
    }

    [HttpPost]
    public async Task<IActionResult> PostOutfit([FromBody] Outfit outfit)
    {
        try
        {
            // 1. 呼叫 Gemini AI 進行分析
            if (!string.IsNullOrEmpty(outfit.ImageUrl))
            {
                var aiAnalysis = await _geminiService.AnalyzeOutfitAsync(outfit.ImageUrl);
                outfit.Description = aiAnalysis; // 將 AI 的分析存入描述欄位
            }

            // 2. 存入資料庫
            _context.Outfits.Add(outfit);
            await _context.SaveChangesAsync();

            return Ok(outfit);
        }
        catch (GeminiApiTimeoutException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                Message = "Gemini 配額或速率限制已達上限，請稍後再試。",
                Detail = ex.Message
            });
        }
        catch (GeminiApiException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                Message = "Gemini 服務呼叫失敗，請稍後再試。",
                Detail = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                Message = ex.Message
            });
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new
            {
                Message = ex.Message
            });
        }
    }
}
