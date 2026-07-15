/* Self-XSS deterrent (like Facebook / Google / Zalo). It does NOT try to block
   DevTools — that's impossible — it warns users against pasting attacker-supplied
   code into the console. Served as a same-origin file so a strict script-src
   'self' CSP allows it, and it isn't touched by the production console-strip.
   English only. */
(function () {
  try {
    console.log(
      '%cStop!',
      'color:#e11d48;font-size:48px;font-weight:900;text-shadow:1px 1px 0 rgba(0,0,0,.15);'
    );
    console.log(
      '%cThis is a browser feature intended for developers. If someone told you to ' +
      'copy and paste something here to enable a TalentScanr feature or to "hack" ' +
      "someone's account, it is a scam and will give them access to your TalentScanr account.",
      'color:#b45309;font-size:16px;font-weight:600;line-height:1.5;'
    );
    console.log(
      '%cVisit https://talentscanr.com/faq to learn more.',
      'color:#b45309;font-size:15px;'
    );
  } catch (e) { /* ignore */ }
})();
