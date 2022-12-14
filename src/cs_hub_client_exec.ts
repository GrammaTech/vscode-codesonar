/** Test front-end for csHubClient module. */
import {
    CSHubUserKey,
} from './csonar_ex';
import { 
    CSHubClient,
    CSHubClientConnectionOptions,
} from './cs_hub_client';


function main(
    argv: string[],
    stdin: NodeJS.ReadableStream,
    stdout: NodeJS.WritableStream,
    stderr: NodeJS.WritableStream,
    onExit: (exitCode: number) => void,
) {
    const endl: string = '\n';
    let errorMessage: string|undefined;
    let hubAddress: string|undefined;
    let targetUrlString: string|undefined;
    let cacertFilePath: string|undefined;
    let userName: string|undefined;
    let userPasswordFilePath: string|undefined;
    let userCertFilePath: string|undefined;
    let userKeyFilePath: string|undefined;

    for (let argIndex: number = 1; !errorMessage && argIndex < argv.length; argIndex++) {
        let arg = argv[argIndex];
        if (arg === '--cacert') {
            argIndex += 1;
            if (argIndex < argv.length) {
                cacertFilePath = argv[argIndex];
            }
        }
        else if (arg === '-hubuser' || arg === '--hubuser') {
            argIndex += 1;
            if (argIndex < argv.length) {
                userName = argv[argIndex];
            }
        }
        else if (arg === '-hubpwfile' || arg === '--hubpwfile') {
            argIndex += 1;
            if (argIndex < argv.length) {
                userPasswordFilePath = argv[argIndex];
            }
        }
        else if (arg === '-hubcert' || arg === '--hubcert') {
            argIndex += 1;
            if (argIndex < argv.length) {
                userCertFilePath = argv[argIndex];
            }
        }
        else if (arg === '-hubkey' || arg === '--hubkey') {
            argIndex += 1;
            if (argIndex < argv.length) {
                userKeyFilePath = argv[argIndex];
            }
        }
        else if (arg.startsWith('-')) {
            errorMessage = `Unrecognized option: '${arg}'.`;
        }
        else if (hubAddress === undefined) {
            hubAddress = arg;
        }
        else if (targetUrlString === undefined) {
            targetUrlString = arg;
        }
        else {
            errorMessage = `Unexpected argument: '${arg}'.`;
        }
    }

    if (!errorMessage && !hubAddress) {
        errorMessage = "Missing Hub Address argument.";
    }
    if (!errorMessage && !targetUrlString) {
        errorMessage = "Missing URL argument.";
    }
    if (errorMessage) {
        stderr.write(errorMessage + endl);
        onExit(2);
    }
    else if (targetUrlString && hubAddress) {
        let hubOptions: CSHubClientConnectionOptions = {};
        if (cacertFilePath)
        {
            hubOptions.cafile = cacertFilePath;
        }
        if (userName) {
            hubOptions.hubuser = userName;
        }
        if (userPasswordFilePath) {
            hubOptions.hubpwfile = userPasswordFilePath;
        }
        if (userCertFilePath || userKeyFilePath) {
            hubOptions.hubkey = new CSHubUserKey(
                userCertFilePath ?? userKeyFilePath ?? "",
                userKeyFilePath ?? userCertFilePath ?? "",
            );
        }
        const errorHandler: ((e: Error|string) => void) = (e: Error|string) => {
            stderr.write(e.toString() + endl);
            onExit(1);
        };
        const hubClient: CSHubClient = new CSHubClient(hubAddress, hubOptions);
        hubClient.logger = console;
        const targetUrlPath: string = targetUrlString;
        hubClient.signIn().then((message: string|undefined): void => {
            if (message) {
                errorHandler(`Hub sign-in rejected: ${message}`);
            }
            else {
                hubClient.fetch(targetUrlPath).then(
                    (resIO: NodeJS.ReadableStream): void => {
                        resIO.setEncoding("utf-8");
                        resIO.pipe(stdout);
                        onExit(0);
                    }).catch(errorHandler);
            }
        }).catch(errorHandler);
    }
}

if (require.main === module) {
    main(
        process.argv.slice(1),
        process.stdin,
        process.stdout,
        process.stderr,
        (exitCode) => { process.exitCode = exitCode; });
}
