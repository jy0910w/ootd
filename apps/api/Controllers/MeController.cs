using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/me")]
public sealed class MeController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;

    public MeController(InMemoryPlatformStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<UserProfileResponse> Get()
    {
        var userId = User.GetRequiredUserId();
        var user = _store.GetUserById(userId);
        if (user is null)
        {
            return NotFound(new ApiErrorResponse("USER_NOT_FOUND", "使用者不存在", null, HttpContext.TraceIdentifier));
        }

        return Ok(new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.StylePreferences, user.Locale));
    }

    [HttpPatch]
    public ActionResult<UserProfileResponse> Patch([FromBody] UpdateMeRequest request)
    {
        var userId = User.GetRequiredUserId();
        var user = _store.UpdateUser(userId, request.DisplayName, request.StylePreferences, request.Locale);
        return Ok(new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.StylePreferences, user.Locale));
    }
}
