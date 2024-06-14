import { TempClient } from "../auth/0auth2.0/entites/temptClient.entity";

export function convertClientCRMClientIntoIntraCRM(userFromSpyre: any) {
    try {
        if (!userFromSpyre.workHistory?.length && userFromSpyre.jobRoles) {
            userFromSpyre.workHistory = userFromSpyre.jobRoles?.map(
                (jobRole) => {
                    return {
                        ...jobRole,
                        achievements: JSON.parse(jobRole.achievements),
                        responsibilities: JSON.parse(jobRole.responsibilities)
                    };
                }
            );
        }
    } catch (err) {
        console.error("Failed to convert work history. Error: ", err);
    }

    try {
        if (!userFromSpyre.educations?.length && userFromSpyre.education) {
            userFromSpyre.educations = userFromSpyre.education?.map((edu) => {
                return {
                    ...edu,
                    educationLevel: edu.educationLevel ?? edu.education_level,
                    institutionName:
                        edu.institutionName ?? edu.name_of_institution,
                    startDate: edu.startDate ?? edu.years_of_employment?.from,
                    endDate: edu.endDate ?? edu.years_of_employment?.to
                };
            });
        }
    } catch (err) {
        console.error("Failed to convert educations. Error: ", err);
    }

    try {
        if (
            !userFromSpyre.trainings?.length &&
            userFromSpyre.extras?.training
        ) {
            userFromSpyre.trainings = userFromSpyre.extras?.training?.map(
                (trn) => {
                    return {
                        ...trn,
                        title: trn.title ?? trn.name,
                        institutionName:
                            trn.institutionName ?? trn.institution_name,
                        startDate:
                            trn.startDate ?? trn.years_of_employment?.from,
                        endDate: trn.endDate ?? trn.years_of_employment?.to
                    };
                }
            );
        }
    } catch (err) {
        console.error("Failed to convert trainings. Error: ", err);
    }

    try {
        if (
            !userFromSpyre.certificates?.length &&
            userFromSpyre.extras?.certificates
        ) {
            userFromSpyre.certificates =
                userFromSpyre.extras?.certificates?.filter(
                    (certificate) => certificate !== null
                );
        }
    } catch (err) {
        console.error("Failed to convert certificates. Error: ", err);
    }

    try {
        if (
            !userFromSpyre.volunteerings?.length &&
            userFromSpyre.extras?.volunteering_experience
        ) {
            userFromSpyre.volunteerings =
                userFromSpyre.extras?.volunteering_experience?.filter(
                    (vol) => vol !== null
                );
        }
    } catch (err) {
        console.error("Failed to convert volunteering. Error: ", err);
    }

    try {
        if (!userFromSpyre.patents?.length && userFromSpyre.extras?.patents) {
            userFromSpyre.patents = userFromSpyre.extras?.patents?.map(
                (patent) => patent !== null
            );
        }
    } catch (err) {
        console.error("Failed to convert patents. Error: ", err);
    }

    try {
        if (!userFromSpyre.awards?.length && userFromSpyre.extras?.awards) {
            userFromSpyre.awards = userFromSpyre.extras?.awards?.map((vol) => {
                return {
                    ...vol,
                    title: vol.title ?? vol.name_of_award,
                    institution: vol.institution ?? vol.issuer
                };
            });
        }
    } catch (err) {
        console.error("Failed to convert awards. Error: ", err);
    }

    try {
        if (
            !userFromSpyre.memberships?.length &&
            userFromSpyre.extras?.memberships_and_assosiations
        ) {
            userFromSpyre.memberships =
                userFromSpyre.extras?.memberships_and_assosiations?.map(
                    (membership) => {
                        const yr = membership.year?.split("-");
                        return {
                            ...membership,
                            name: membership.name ?? membership.membership_name,
                            issuer:
                                membership.issuer ??
                                membership.organisation_name,
                            startDate:
                                membership.startDate ?? !yr
                                    ? ""
                                    : yr.length > 0
                                        ? yr[0]
                                        : "",
                            endDate:
                                membership.endDate ?? !yr
                                    ? ""
                                    : yr.length === 1
                                        ? yr[1]
                                        : ""
                        };
                    }
                );
        }
    } catch (err) {
        console.error("Failed to convert memberships. Error: ", err);
    }

    try {
        if (
            !userFromSpyre.publications?.length &&
            userFromSpyre.extras?.publications
        ) {
            userFromSpyre.publications =
                userFromSpyre.extras?.publications?.map((publication) => {
                    return {
                        ...publication,
                        title:
                            publication.title ?? publication.publication_title,
                        publisher:
                            publication.publisher ?? publication.organisation
                    };
                });
        }
    } catch (err) {
        console.error("Failed to convert publications. Error: ", err);
    }
    return userFromSpyre;
}

export function convertClientStringToJson(client: TempClient) {
    const data: any = {
        ...client
    };
    data.workHistory = JSON.parse(client.workHistory);
    data.publications = JSON.parse(client.publications);
    data.awards = JSON.parse(client.awards);
    data.memberships = JSON.parse(client.memberships);
    data.educations = JSON.parse(client.educations);
    data.patents = JSON.parse(client.patents);
    data.volunteerings = JSON.parse(client.volunteerings);
    data.certificates = JSON.parse(client.certificates);
    data.trainings = JSON.parse(client.trainings);
    data.projects = JSON.parse(client.projects);
    data.professionalSkills = JSON.parse(client.professionalSkills);
    data.technicalSkills = JSON.parse(client.technicalSkills);
    return data;
}
