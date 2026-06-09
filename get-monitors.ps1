$monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID
$res = @()
foreach ($m in $monitors) {
    $name = [System.Text.Encoding]::ASCII.GetString($m.UserFriendlyName).TrimEnd("`0")
    $res += $name
}
$res | ConvertTo-Json
