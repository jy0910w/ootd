# 第一階段：編譯環境
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 複製 csproj 並還原套件 (利用 Docker 快取加速)
COPY ["OotdPlatform.Api.csproj", "./"]
RUN dotnet restore

# 複製所有檔案並進行編譯
COPY . .
RUN dotnet publish -c Release -o /app/publish

# 第二階段：執行環境 (更輕量)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# 設定環境變數，讓 API 在容器內預設監聽 80 端口
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "OotdPlatform.Api.dll"]