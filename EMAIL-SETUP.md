# Setting up your outreach email in ARIES

ARIES sends candidate outreach **from your own email address** — there is no
shared mailbox. You must configure and verify your email before you can send
any outreach. Pick **one** of the two options below.

Open **Email settings** from the button in the top bar to enter your details.

---

## Option A — Gmail App Password

**Best for:** individual recruiters. Free, ~500 emails/day, uses your existing
Gmail account.

### Steps

1. **Enable 2-Step Verification** (required for app passwords)
   → https://myaccount.google.com/security → turn on "2-Step Verification".

2. **Create an App Password**
   → https://myaccount.google.com/apppasswords
   - App name: `ARIES`
   - Click **Create**.

3. **Copy the 16-character password** Google shows, e.g. `abcd efgh ijkl mnop`.
   *(It is shown only once. If you lose it, just create another.)*

4. In ARIES **Email settings**:
   - Provider: **Gmail (App Password)**
   - From address: your Gmail address (e.g. `you@gmail.com`)
   - From name: how you want to appear (e.g. `Jane Smith`)
   - Gmail App Password: paste the 16-char password
   - Click **Save**.

5. Click **Send test email**. When the test arrives in your inbox, your email
   is **verified** and you can send outreach.

### Notes
- Replies are detected automatically — ARIES checks your Gmail inbox every few
  minutes and marks candidates as **Replied**.
- Your app password is encrypted on our servers and never displayed again.

---

## Option B — Resend (custom domain)

**Best for:** teams and agencies who want to send from `@yourcompany.com` with
the best deliverability.

### Steps

1. **Sign up** at https://resend.com (free tier: 3,000 emails/month).

2. **Add and verify your domain**
   - Resend → **Domains → Add Domain** → enter your company domain.
   - Add the **SPF, DKIM, and DMARC** DNS records Resend gives you to your
     domain's DNS settings.
   - Wait until the domain shows **Verified** (usually a few minutes).

3. **Create an API key**
   - Resend → **API Keys → Create API Key** (Sending access is enough).
   - Copy the key (starts with `re_`).

4. In ARIES **Email settings**:
   - Provider: **Resend (custom domain)**
   - From address: an address on your verified domain (e.g. `jane@company.com`)
   - From name: how you want to appear
   - Resend API Key: paste the `re_…` key
   - Click **Save**.

5. Click **Send test email**. When the test arrives, your email is **verified**
   and you can send outreach.

### Notes
- The **From address domain must match** a domain you verified in Resend, or
  sends will be rejected.
- Resend has **no inbox**, so candidate replies are *not* auto-detected —
  use the **Mark replied** button in the Outreach activity panel.
- Your API key is encrypted on our servers and never displayed again.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Test fails: "Username and Password not accepted" (Gmail) | 2-Step Verification isn't on, or the app password was mistyped. Recreate it. |
| Test fails: "domain is not verified" (Resend) | Your From address uses a domain you haven't verified in Resend. Verify it first. |
| "You have not configured your outreach email yet" when sending | Finish the steps above and pass the test send. |
| Changed my password/key | Re-enter it in Email settings and run the test again — changing credentials resets verification. |

## Security

- Credentials (Gmail app password / Resend API key) are encrypted with
  AES-256-GCM before being stored and are never returned to the browser.
- The app only ever shows whether a credential is *configured*, not its value.
- Clearing your config removes the stored credential entirely.
