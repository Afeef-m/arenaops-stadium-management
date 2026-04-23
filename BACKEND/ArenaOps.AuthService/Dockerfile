FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
RUN apk add --no-cache icu-libs
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
WORKDIR /app

# Copy published output
COPY publish/ .

# RSA key directory (mounted at runtime via docker-compose volume)
RUN mkdir -p /app/Keys

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 80

ENTRYPOINT ["dotnet", "ArenaOps.AuthService.API.dll"]
