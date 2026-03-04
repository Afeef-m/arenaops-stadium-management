
$loginUrl = "http://localhost:5001/api/auth/login"
$body = @{ email = "admin@arenaops.com"; password = "Password123!" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
return $response.data.accessToken

