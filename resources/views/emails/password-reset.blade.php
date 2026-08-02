<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password Akun Coffey</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1ea;font-family:Arial,Helvetica,sans-serif;color:#2a2118;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f1ea;padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(90,60,30,.08);">
                <tr>
                    <td style="background-color:#9c4f2e;padding:28px 32px;text-align:center;">
                        <span style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:.5px;">Coffey</span>
                        <div style="font-size:12px;color:#f0d9c4;margin-top:2px;">Coffee Marketplace</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px 32px 8px 32px;">
                        <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;color:#9c4f2e;">Reset Password Akun Kamu</h1>
                        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4a4035;">Halo{{ $name ? ', ' . $name : '' }}! Kami menerima permintaan untuk mereset password akun Coffey kamu. Klik tombol di bawah untuk melanjutkan.</p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:16px 32px;">
                        <a href="{{ $url }}" style="display:inline-block;background-color:#9c4f2e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:10px;">Reset Password</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 32px 8px 32px;">
                        <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#7a6a58;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser kamu:</p>
                        <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;word-break:break-all;color:#9c4f2e;">{{ $url }}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 32px 28px 32px;">
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#7a6a58;">Tautan ini berlaku selama <strong>60 menit</strong>. Jika kamu tidak meminta reset password, abaikan email ini — password kamu tetap aman.</p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color:#f3ece2;padding:16px 32px;text-align:center;border-top:1px solid #eadcc9;">
                        <span style="font-size:11px;color:#8a7a66;">&copy; {{ date('Y') }} Coffey &middot; Coffee Marketplace</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
