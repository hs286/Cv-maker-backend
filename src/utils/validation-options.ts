import {
    HttpException,
    HttpStatus,
    ValidationError,
    ValidationPipeOptions
} from "@nestjs/common";

const generateErrorMessage = (errorData: ValidationError) => {
    if (errorData.constraints) {
        return Object.values(errorData.constraints).join(", ");
    }
    if (errorData.children && errorData.children.length > 0) {
        const propertyName = errorData.property;
        const nestedError = errorData.children[0];
        return `${propertyName} => ` + generateErrorMessage(nestedError);
    }
    return "";
};

export const validationOptions: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    exceptionFactory: (errors: ValidationError[]) => {
        let errorMsg = "";
        if (errors && errors.length > 0) {
            const errorData = errors[0];
            errorMsg = generateErrorMessage(errorData);
        }
        return new HttpException(
            {
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                error: errorMsg,
                message: errorMsg
            },
            HttpStatus.UNPROCESSABLE_ENTITY
        );
    }
};

export const regex_24_hr_format = "^(2[0-3]|[01]?[0-9])$";
export const regex_24_hr_time_format = "^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$";
// eslint-disable-next-line prettier/prettier
export const regex_date_format =
    /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;

export default validationOptions;
