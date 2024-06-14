export enum UploadType {
    /**
     * For uploading files related to user configuration such as profile picture
     */
    CONFIG = "config",
    /**
     * For uploading files other than user configuration such cvs
     */
    UPLOAD = "upload",

    CV_DRAFT = "cv draft",

    FINAL_CV = "final cv",

    GENERATED_CV = "generated cv"
}
