const templateData = {
  name: "password_reset_link",
  language: "en_US",
  category: "UTILITY",
  components: [
    {
      type: "HEADER",
      format: "IMAGE",
      example: {
        header_handle: [
          "https://yourdomain.com/images/app-banner.jpg", // Replace with your actual banner URL
        ],
      },
    },
    {
      type: "BODY",
      text: "Hello {{1}},\n\nYou requested to reset your password. Click the button below to create a new password. This link will expire in 1 hour.\n\nIf you didn't request this, please ignore this message.",
      example: {
        body_text: [
          ["John Doe"], // Example name variable
        ],
      },
    },
    {
      type: "BUTTONS",
      buttons: [
        {
          type: "URL",
          text: "Reset Password",
          url: "https://yourdomain.com/reset-password?token={{1}}", // {{1}} will be replaced with actual token
          example: ["abc123def456"], // Example token for approval
        },
      ],
    },
    {
      type: "FOOTER",
      text: "This link expires in 1 hour",
    },
  ],
};
