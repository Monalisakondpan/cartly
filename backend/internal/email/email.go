package email

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"mime"
	"net/smtp"
	"os"
)

const smtpHost = "smtp.gmail.com"
const smtpPort = "587"
const logoPath = "../frontend/public/logo.jpg"

func Send(fromEmail, fromPassword, toEmail, subject, body string) error {
	auth := smtp.PlainAuth("", fromEmail, fromPassword, smtpHost)

	logoBytes, err := os.ReadFile(logoPath)
	if err != nil {
		msg := []byte(fmt.Sprintf(
			"From: Cartly <%s>\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s\r\n",
			fromEmail, toEmail, subject, body,
		))
		return smtp.SendMail(smtpHost+":"+smtpPort, auth, fromEmail, []string{toEmail}, msg)
	}

	boundary := "cartly-boundary-42"
	encodedLogo := base64.StdEncoding.EncodeToString(logoBytes)
	encodedSubject := mime.QEncoding.Encode("UTF-8", subject)

	var buf bytes.Buffer
	buf.WriteString(fmt.Sprintf("From: Cartly <%s>\r\n", fromEmail))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", toEmail))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", encodedSubject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString(fmt.Sprintf("Content-Type: multipart/related; boundary=\"%s\"\r\n\r\n", boundary))

	buf.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	buf.WriteString("Content-Type: text/html; charset=UTF-8\r\n\r\n")
	buf.WriteString(fmt.Sprintf(`<div style="text-align:center; margin-bottom:16px;"><img src="cid:cartlylogo" alt="Cartly" style="height:48px; border-radius:6px;" /></div>%s`, body))
	buf.WriteString("\r\n\r\n")

	buf.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	buf.WriteString("Content-Type: image/jpeg\r\n")
	buf.WriteString("Content-Transfer-Encoding: base64\r\n")
	buf.WriteString("Content-ID: <cartlylogo>\r\n")
	buf.WriteString("Content-Disposition: inline\r\n\r\n")
	buf.WriteString(encodedLogo)
	buf.WriteString("\r\n\r\n")

	buf.WriteString(fmt.Sprintf("--%s--", boundary))

	return smtp.SendMail(smtpHost+":"+smtpPort, auth, fromEmail, []string{toEmail}, buf.Bytes())
}

func WelcomeEmail(name string) (subject string, body string) {
	subject = "Welcome to Cartly!"
	body = fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 500px;">
			<h2 style="color: #163832;">Welcome to Cartly, %s!</h2>
			<p>Your account has been created successfully. You're all set to get started.</p>
			<p style="text-align:center; margin: 24px 0;">
				<a href="http://localhost:5173/login" style="background:#163832; color:#fff; padding:10px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Get Started</a>
			</p>
			<p style="color: #888; font-size: 13px;">If you didn't create this account, you can safely ignore this email.</p>
		</div>
	`, name)
	return subject, body
}

func OrderConfirmationEmail(customerName string, orderID string, total float64) (subject string, body string) {
	subject = fmt.Sprintf("Order Confirmation - #%s", orderID)
	body = fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 500px;">
			<h2 style="color: #163832;">Thanks for your order, %s!</h2>
			<p>Your order <strong>#%s</strong> has been placed successfully.</p>
			<p><strong>Total: $%.2f</strong></p>
			<p>We'll notify you once your order status changes.</p>
		</div>
	`, customerName, orderID, total)
	return subject, body
}

func PasswordResetEmail(resetLink string) (subject string, body string) {
	subject = "Reset Your Cartly Password"
	body = fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 500px;">
			<h2 style="color: #163832;">Reset Your Password</h2>
			<p>We received a request to reset your password. Click the button below to choose a new one.</p>
			<p style="text-align:center; margin: 24px 0;">
				<a href="%s" style="background:#163832; color:#fff; padding:10px 24px; text-decoration:none; border-radius:6px; display:inline-block;">Reset Password</a>
			</p>
			<p style="color: #888; font-size: 13px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
		</div>
	`, resetLink)
	return subject, body
}