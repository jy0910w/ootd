using System.Security.Claims;

namespace OotdPlatform.Api.Controllers;

internal static class ControllerUserExtensions
{
    public static Guid GetRequiredUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (Guid.TryParse(value, out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("USER_ID_MISSING");
    }

    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (Guid.TryParse(value, out var userId))
        {
            return userId;
        }

        return null;
    }
}
