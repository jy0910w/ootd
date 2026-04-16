using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OotdPlatform.Api.Contracts;
using OotdPlatform.Api.Services;

namespace OotdPlatform.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly InMemoryPlatformStore _store;
    private readonly JwtTokenService _tokenService;

    public AuthController(InMemoryPlatformStore store, JwtTokenService tokenService)
    {
        _store = store;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public ActionResult<AuthResponse> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = _store.CreateUser(request.Email, request.Password, request.DisplayName);
            return Created(string.Empty, BuildAuthResponse(user));
        }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_ALREADY_EXISTS")
        {
            return Conflict(new ApiErrorResponse("EMAIL_ALREADY_EXISTS", "Email 已被註冊", null, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
    {
        var user = _store.ValidateUserCredentials(request.Email, request.Password);
        if (user is null)
        {
            return Unauthorized(new ApiErrorResponse("INVALID_CREDENTIALS", "帳號或密碼錯誤", null, HttpContext.TraceIdentifier));
        }

        return Ok(BuildAuthResponse(user));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public ActionResult<object> Refresh([FromBody] RefreshTokenRequest request)
    {
        var validation = _tokenService.ValidateRefreshToken(request.RefreshToken);
        if (!validation.Success)
        {
            return Unauthorized(new ApiErrorResponse("REFRESH_TOKEN_INVALID", "Refresh token 無效或已過期", null, HttpContext.TraceIdentifier));
        }

        var user = _store.GetUserById(validation.UserId);
        if (user is null)
        {
            return Unauthorized(new ApiErrorResponse("USER_NOT_FOUND", "使用者不存在", null, HttpContext.TraceIdentifier));
        }

        var newRefreshToken = _tokenService.RotateRefreshToken(request.RefreshToken);
        return Ok(new
        {
            AccessToken = _tokenService.GenerateAccessToken(user),
            RefreshToken = newRefreshToken
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult<object> Logout([FromBody] LogoutRequest request)
    {
        _tokenService.RevokeRefreshToken(request.RefreshToken);
        return Ok(new { Success = true });
    }

    private AuthResponse BuildAuthResponse(PlatformUser user)
    {
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);
        var accessToken = _tokenService.GenerateAccessToken(user);

        return new AuthResponse(
            new UserProfileResponse(user.Id, user.Email, user.DisplayName, user.Role, user.Status, user.StylePreferences, user.Locale),
            accessToken,
            refreshToken);
    }
}
