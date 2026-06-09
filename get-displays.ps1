$src = @"
using System;
using System.Runtime.InteropServices;
public class Display {
    [DllImport("user32.dll", CharSet=CharSet.Ansi)]
    public static extern bool EnumDisplayDevices(string lpDevice, uint iDevNum, ref DISPLAY_DEVICE lpDisplayDevice, uint dwFlags);
    [DllImport("user32.dll", CharSet=CharSet.Ansi)]
    public static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
    
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public struct DISPLAY_DEVICE {
        public int cb;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string DeviceName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceString;
        public int StateFlags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceID;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=128)] public string DeviceKey;
    }
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmDeviceName;
        public short dmSpecVersion; public short dmDriverVersion; public short dmSize; public short dmDriverExtra;
        public int dmFields; public int dmPositionX; public int dmPositionY; public int dmDisplayOrientation; public int dmDisplayFixedOutput;
        public short dmColor; public short dmDuplex; public short dmYResolution; public short dmTTOption; public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmFormName;
        public short dmLogPixels; public int dmBitsPerPel; public int dmPelsWidth; public int dmPelsHeight;
        public int dmDisplayFlags; public int dmDisplayFrequency; public int dmICMMethod; public int dmICMIntent;
        public int dmMediaType; public int dmDitherType; public int dmReserved1; public int dmReserved2; public int dmPanningWidth; public int dmPanningHeight;
    }
}
"@
Add-Type -TypeDefinition $src

$result = @()
$dev = New-Object Display+DISPLAY_DEVICE
$dev.cb = [System.Runtime.InteropServices.Marshal]::SizeOf($dev)

$i = 0
while ([Display]::EnumDisplayDevices($null, $i, [ref]$dev, 0)) {
    if (($dev.StateFlags -band 1) -eq 1) { 
        $mode = New-Object Display+DEVMODE
        $mode.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mode)
        [Display]::EnumDisplaySettings($dev.DeviceName, -1, [ref]$mode) | Out-Null
        
        $mon = New-Object Display+DISPLAY_DEVICE
        $mon.cb = [System.Runtime.InteropServices.Marshal]::SizeOf($mon)
        [Display]::EnumDisplayDevices($dev.DeviceName, 0, [ref]$mon, 0) | Out-Null
        
        $result += [PSCustomObject]@{
            Name = $mon.DeviceString
            Hz = $mode.dmDisplayFrequency
            Width = $mode.dmPelsWidth
            Height = $mode.dmPelsHeight
            GPU = $dev.DeviceString
        }
    }
    $i++
}
$result | ConvertTo-Json
