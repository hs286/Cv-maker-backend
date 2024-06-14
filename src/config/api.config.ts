import { registerAs } from "@nestjs/config";
import * as process from "process";

export default registerAs("api", () => ({
  CVReaderBaseUrl: process.env.CV_READER_BASE_URL,
  CVReaderApiKey: process.env.CV_READER_API_KEY,
  CVValuatorApiUrl: process.env.CV_VALUATOR_BASE_URL,
  CVValuatorApiKey: process.env.CV_VALUATOR_API_KEY,
  JobScrapperApiKey: process.env.JOB_SCRAPPER_API_KEY,
  JobScrapperApiUrl: process.env.JOB_SCRAPPER_BASE_URL,
  ATSBaseUrl: process.env.ATS_BASE_URL,
  ATSApiKey: process.env.ATS_API_KEY,
  ClownFishBaseUrl: process.env.CLOWN_FISH_BASE_URL,
  ClownFishApiKey: process.env.CLOWN_FISH_API_KEY,
  TotalJobsBaseUrl: process.env.TOTAL_JOBS_BASE_URL,
  TotalJobsApiKey: process.env.TOTAL_JOBS_API_KEY,
  ReedBaseUrl: process.env.REED_BASE_URL,
  ReedApiKey: process.env.REED_API_KEY,
  MarketingBaseUrl: process.env.MARKETING_BASE_URL,
  MarketingApiKey: process.env.MARKETING_API_KEY,
  MarketingOauthToken: process.env.MARKETING_OAUTH_TOKEN,
  TextMagicBaseUrl: process.env.TEXT_MAGIC_SMS_URL,
  TextMagicApiKey: process.env.TEXT_MAGIC_API_KEY,
  TextMagicUsername: process.env.TEXT_MAGIC_USERNAME,
}));
