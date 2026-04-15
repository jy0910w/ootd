using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/feedback")]
public sealed class FeedbackController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;

    public FeedbackController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpPost]
    public ActionResult<CreateFeedbackResponse> Create([FromBody] CreateFeedbackRequest request)
    {
        try
        {
            var userId = User.GetRequiredUserId();
            var feedback = _store.CreateFeedback(userId, request.RecommendationId, request.Helpful, request.Reason);
            return StatusCode(StatusCodes.Status201Created, new CreateFeedbackResponse(feedback.Id, true));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorResponse("RECOMMENDATION_NOT_FOUND", "推薦紀錄不存在", null, HttpContext.TraceIdentifier));
        }
    }
}
