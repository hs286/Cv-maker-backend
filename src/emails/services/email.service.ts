import { Injectable } from "@nestjs/common";
import * as sgMail from "@sendgrid/mail";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";
import * as process from "node:process";

@Injectable()
export class EmailSendingService {
    constructor() {
        sgMail.setApiKey(process.env.SPYRE_CRM_EMAIL_API_KEY);
    }

    // todo: move to a separate email service later.
    async sendAccountCreationEmail(
        email: string, // Add email parameter
        subject: string,
        type: "withPassword" | "withoutPassword",
        tempPassword?: string // Add tempPassword parameter
    ) {
        // Log the contents of the './templates' directory
        try {
            // console.log current working direcotry
            const templateFile =
                type === "withPassword" ? "signup.hbs" : "simple_signup.hbs";
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                templateFile
            );

            console.log("templateFile", templateFile);

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            // Define the context including email and tempPassword
            const context = {
                email: email,
                tempPassword: tempPassword
            };

            const html = template(context);

            const msg = {
                to: email,
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: subject,
                html: html
            };

            await sgMail.send(msg);

            return "success";
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

    async sendForgotPasswordEmail(
        email: string,
        fullName: string,
        ResetPasswordLink: string
    ) {
        // Log the contents of the './templates' directory
        try {
            // console.log current working direcotry
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "forgot_password.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email: email,
                fullName: fullName,
                verificationLink: ResetPasswordLink
            };

            const html = template(context);

            const msg = {
                to: email, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${fullName} - Reset Password`,
                html: html
            };

            await sgMail.send(msg);

            console.log("Reset Password Email sent to " + email);

            return "success";
        } catch (error) {
            console.error("Error sending reset password email:", error);
            throw error;
        }
    }

    async sendTestEmail() {
        await this.sendAccountCreationEmail(
            "myousafdev@gmail.com",
            "ACCOUNT TEST EMAIL !!!",
            "withoutPassword"
        );
    }

    async sendBookingEmailToAdmin(
        email: string,
        fullName: string,
        phoneNumber: string
    ) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "booking_email.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email: email,
                time: this.add30MinutesToCurrentTime(),
                fullName: fullName,
                phoneNumber: phoneNumber
            };

            const html = template(context);

            const msg = {
                to: process.env.SPYRE_CRM_ADMIN_EMAIL, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${fullName} - New Call Booking`, // Subject includes client's name
                html: html
            };

            await sgMail.send(msg);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    add30MinutesToCurrentTime() {
        // Get the current date and time
        const date = new Date();
    
        // Add 30 minutes to the current time
        date.setMinutes(date.getMinutes() + 30);
    
        // Get the new hours and minutes
        let newHours = date.getHours();
        const newMinutes = String(date.getMinutes()).padStart(2, '0');
    
        // Determine AM/PM period
        const period = newHours >= 12 ? 'PM' : 'AM';
    
        // Convert hours from 24-hour to 12-hour format
        newHours = newHours % 12;
        newHours = newHours ? newHours : 12; // Handle case for 0 (midnight)
    
        // Format the hours to always have two digits
        const formattedHours = String(newHours).padStart(2, '0');
    
        // Return the new time as a string in the format HH:MM AM/PM
        return `${formattedHours}:${newMinutes} ${period}`;
    }

    async sendBookingEmailToBooker(
        email: string,
        fullName: string,
        phoneNumber: string
    ) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "booking_email_to_booker.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email: email,
                time: this.add30MinutesToCurrentTime(),
                fullName: fullName,
                phoneNumber: phoneNumber
            };

            const html = template(context);

            const msg = {
                to: email, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${fullName} - Call Booking Confirmation`,
                html: html
            };

            await sgMail.send(msg);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    async sendEmailVerification(
        email: string,
        fullName: string,
        verificationLink: string
    ) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "email_verification_email.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email: email,
                fullName: fullName,
                verificationLink: verificationLink
            };

            const html = template(context);

            const msg = {
                to: email, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${fullName} - Email Address Change Verification`,
                html: html
            };

            await sgMail.send(msg);
            console.log("Email address (Change) verification sent to " + email);
            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    async sendEmailVerificationOTPCode(
        email: string,
        fullName: string,
        otpCode: number
    ) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "email_otp_code.hbs"
            );

            console.log("templatePath", templatePath);

            const templateSourc2 = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSourc2);

            const context = {
                email: email,
                fullName: fullName,
                otpCode: otpCode
            };

            const html = template(context);

            const msg = {
                to: email, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${fullName} - Email address verification OTP Code`,
                html: html
            };

            await sgMail.send(msg);

            console.log("Email address verification [OTP] sent to " + email);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    async sendEmailInvoice({
        email,
        name,
        invoiceUrl,
        // checkoutUrl,
        items
    }) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "invoice_email.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email: email,
                fullName: name,
                invoiceUrl,
                // checkoutUrl,
                items
            };

            const html = template(context);

            const msg = {
                to: email, // Add the admin email address
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `${name} - Invoice`,
                html: html
            };

            await sgMail.send(msg);

            console.log("Invoice sent to " + email);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    async sendServiceCompleteEmailToUser({
        email,
        fullName,
        textBody,
        subject,
        cVSpecialistName
    }) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "generic_email_service_completed.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                email,
                clientName: fullName,
                bodyContent: textBody,
                specialistName: cVSpecialistName,
                subject
            };

            const html = template(context);

            const msg = {
                to: email,
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject,
                html
            };

            await sgMail.send(msg);

            console.log("Email sent to " + email);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }

    async sendApplyJobEmail({
        email,
        fullName,
        jobTitle,
        jobLocation,
        jobSalary,
        jobEmployer,
        jobReference
    }) {
        try {
            const templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "apply_job.hbs"
            );

            const templateSource = fs.readFileSync(templatePath).toString();
            const template = handlebars.compile(templateSource);

            const context = {
                fullName,
                jobTitle,
                jobLocation,
                jobSalary,
                jobEmployer,
                jobReference
            };

            const html = template(context);

            const msg = {
                to: email,
                from: process.env.SPYRE_CRM_EMAIL_SENDER,
                subject: `Application for ${jobTitle}`,
                html
            };

            await sgMail.send(msg);

            return "success";
        } catch (error) {
            console.error("Error sending booking email:", error);
            throw error;
        }
    }
}
