import { Probot } from "probot";
import parse from "./gitDiffParser";
import request from "request";
import pomParser from "./pomParser";
import { compareVersions } from 'compare-versions';

export = (app: Probot) => {
  app.on("pull_request_review.dismissed", async (context) => {
    console.log("-- Checking if previous state of PR was approved --");
    let events = await context.octokit.activity.listRepoEvents({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    });
    let validations = { isConflictResolved: true, isVersionIncremented: true, wasPrApproved: false, isConflictInNonVersionFile: false };
    await checkIfPrApproved(events, context, validations);
    if (validations.wasPrApproved === true) {
      const headCommit = context.repo({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        per_page: 100
      });
      const prCommits = context.repo({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: context.payload.pull_request.number,
        per_page: 100
      });
      let headCommitResponse = await context.octokit.repos.listCommits(headCommit);
      let parentHeadCommitSha = headCommitResponse.data[0]['sha'];
      let prCommitsResponse = await context.octokit.pulls.listCommits(prCommits);
      let parentCommits: any[]
      parentCommits = prCommitsResponse.data[prCommitsResponse.data.length - 1]['parents'];
      let isBMTakenFromMaster = false;
      for (let commit in parentCommits) {
        if (parentCommits[commit]['sha'] === parentHeadCommitSha) {
          console.log("last backmerge was taken from master");
          isBMTakenFromMaster = true;
        }
      }
      console.log("isBMTakenFromMaster " + isBMTakenFromMaster);
      if (isBMTakenFromMaster === true) {
        if (prCommitsResponse.data.length >= 2) {
          let branchCommitDiff = await context.octokit.repos.compareCommits({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            base: prCommitsResponse.data[prCommitsResponse.data.length - 2]["sha"],
            head: prCommitsResponse.data[prCommitsResponse.data.length - 1]["sha"]
          });
          let currentBranchFileNames = [];
          branchCommitDiff.data.files.forEach(file => currentBranchFileNames.push(file.filename));
          let aheadBy = Number(branchCommitDiff.data.ahead_by);
          let behindBy = Number(branchCommitDiff.data.behind_by);
          console.log("aheadBy " + aheadBy);
          console.log("behindBy " + behindBy);
          if (behindBy === 0 && aheadBy < 100) {
            let defaultBranchCommitDiff = await context.octokit.repos.compareCommits({
              owner: context.payload.repository.owner.login,
              repo: context.payload.repository.name,
              base: headCommitResponse.data[aheadBy - 1]['sha'],
              head: headCommitResponse.data[0]['sha']
            });
            let defaultBranchFileNames = [];
            defaultBranchCommitDiff.data.files.forEach(file => defaultBranchFileNames.push(file.filename));
            let isBackMergeProper = true;
            for (let fileName in currentBranchFileNames) {
              if (!(fileName in defaultBranchFileNames)) {
                isBackMergeProper = false;
              }
            }
            if (isBackMergeProper === true) {
              let prDiff = await context.octokit.pulls.get({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                pull_number: context.payload.pull_request.number,
                mediaType: {
                  format: "diff"
                }
              });
              let diff = prDiff.data;
              var files = parse(String(diff));
              await checkIfMergeConflictResolvedAndOnlyVersionfile(files, context, headCommitResponse, prCommitsResponse,  validations);
              console.log("Merge conflict validation: " + validations.isConflictResolved);
              console.log("Merge Conflict in non version file validation: " + validations.isConflictInNonVersionFile);
              if (validations.isConflictResolved === true && validations.isConflictInNonVersionFile === false) {
                let filesResponse = await context.octokit.pulls.listFiles({
                  owner: context.payload.repository.owner.login,
                  repo: context.payload.repository.name,
                  pull_number: context.payload.pull_request.number
                });
                checkPomVersionIncremented(filesResponse, prCommitsResponse, parentHeadCommitSha, validations).then(async function (_result) {
                  if (validations.isVersionIncremented === true) {
                    createPullRequestReview(context.payload.repository.owner.login, context.payload.repository.name, context.payload.pull_request.number, "pr_automation_bot approving PR as backmerge taken from default branch")
                    // let prApprovalResponse = await context.octokit.pulls.createReview({
                    //   owner: context.payload.repository.owner.login,
                    //   repo: context.payload.repository.name,
                    //   pull_number: context.payload.pull_request.number,
                    //   event: "APPROVE",
                    //   body: "pr_automation_bot approving PR as backmerge taken from default branch",
                    // });
                    // console.log("PR approved " + prApprovalResponse.data);
                  } else {
                    let prRequestChangesResponse = await context.octokit.pulls.createReview({
                      owner: context.payload.repository.owner.login,
                      repo: context.payload.repository.name,
                      pull_number: context.payload.pull_request.number,
                      event: "REQUEST_CHANGES",
                      body: "pr_automation_bot detected version not ahead of master. Please increase version to get approval."
                    });
                    console.log("PR changes requested " + prRequestChangesResponse.data);
                  }
                });
              } else {
                if(validations.isConflictInNonVersionFile) {
                  let prRequestChangesResponse = await context.octokit.pulls.createReview({
                    owner: context.payload.repository.owner.login,
                    repo: context.payload.repository.name,
                    pull_number: context.payload.pull_request.number,
                    event: "REQUEST_CHANGES",
                    body: "pr_automation_bot detected merge conflicts in non version files. Please get approved by the codeowners."
                  });
                  console.log("PR changes requested " + prRequestChangesResponse.data);
                } else if(validations.isConflictResolved === false) {
                    let prRequestChangesResponse = await context.octokit.pulls.createReview({
                    owner: context.payload.repository.owner.login,
                    repo: context.payload.repository.name,
                    pull_number: context.payload.pull_request.number,
                    event: "REQUEST_CHANGES",
                    body: "pr_automation_bot detected merge conflicts not resolved. Please resolve to get approval."
                  });
                  console.log("PR changes requested " + prRequestChangesResponse.data);
                }
              }
            }
          }
        }
      }
    }
  });
};

async function checkPomVersionIncremented(filesResponse: { data: any[]; }, prCommitsResponse: { data: string | any[]; }, parentHeadCommitSha: string, validations: { isConflictResolved: boolean, isVersionIncremented: boolean, wasPrApproved: boolean, isConflictInNonVersionFile: boolean }) {
  return new Promise(async function (resolve) {
    let isPomFilePresent = false;
    try {
      for await (let file of filesResponse.data) {
        if (file.filename.indexOf('pom.xml') !== -1) {
          isPomFilePresent = true;
          let URL = file.contents_url;
          const currentFileContent = await doRequest(decodeURIComponent(URL));
          const currentFileContentJson = JSON.parse(JSON.stringify(currentFileContent));
          let currentBranchPom = await doRequest(decodeURIComponent(JSON.parse(currentFileContentJson)["download_url"]));
          let currentBranchPomObject = await parsePom(String(currentBranchPom));
          console.log("Current branch version - " + currentBranchPomObject["project"]["version"]);
          let currentBranchVersion = currentBranchPomObject["project"]["version"];
          console.log("branch latest commit - " + prCommitsResponse.data[prCommitsResponse.data.length - 1]['sha']);
          console.log("head branch latest commit - " + parentHeadCommitSha);
          URL = URL.replace(prCommitsResponse.data[prCommitsResponse.data.length - 1]['sha'], parentHeadCommitSha);
          const masterFileContent = await doRequest(decodeURIComponent(URL));
          const masterFileContentJson = JSON.parse(JSON.stringify(masterFileContent));
          let masterBranchPom = await doRequest(decodeURIComponent(JSON.parse(masterFileContentJson)["download_url"]));
          let masterBranchPomObject = await parsePom(String(masterBranchPom));
          console.log("Master branch version - " + masterBranchPomObject["project"]["version"]);
          let headPomVersion = masterBranchPomObject["project"]["version"];
          let comparisonResult = compareVersions(String(currentBranchVersion).split('-')[0], String(headPomVersion).split('-')[0]);
          let comparisonResultBoolean = comparisonResult > 0 ? true : false;
          validations.isVersionIncremented = validations.isVersionIncremented && comparisonResultBoolean;
        }
      };
      if(isPomFilePresent === false) {
        validations.isVersionIncremented = false;
      }
    } catch(error) {
      console.log(error)
    }
    resolve(validations.isVersionIncremented);
  });
};

async function checkIfMergeConflictResolvedAndOnlyVersionfile(files: any[], context: any, headCommitResponse: any, prCommitsResponse: any, validations: { isConflictResolved: boolean, isVersionIncremented: boolean, wasPrApproved: boolean, isConflictInNonVersionFile: boolean }) {
  let isPomPresent = false;
  files.forEach(function (file) {
    console.log(file.from)
    if(file.from.indexOf("pom.xml") !== -1) {
      isPomPresent = true;
    }
  });
  if(isPomPresent) {
    try {
      console.log("checkIfMergeConflictResolvedAndOnlyVersionfile");
      const response = await context.octokit.repos.compareCommits({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        base: prCommitsResponse.data[prCommitsResponse.data.length - 2]["sha"],
        head: headCommitResponse.data[0]['sha']
      });
      response.data.files.forEach(file => {if(file.status === 'conflicted' && file.filename.indexOf("pom.xml") === -1) {
        validations.isConflictInNonVersionFile = true;
      }});
  
      if (validations.isConflictInNonVersionFile) {
        console.log('Merge conflicts exist in non version file.');
      } else {
        console.log('No merge conflicts found between the two commits in non version file.');
      }
    } catch (error) {
      console.error('Error checking merge conflicts:', error);
    }
    files.forEach(function (file) {
      file.chunks.forEach(function (chunk: { changes: any[]; }) {
        chunk.changes.forEach(change => {
          if (change.type === "add") {
            if (change.content.includes(">>>>") || change.content.includes("<<<<") || change.content.includes("====")) {
              validations.isConflictResolved = false;
            }
          }
        });
      })
    });
  }
};

function doRequest(url: string) {
  return new Promise(function (resolve, reject) {
    const TOKEN = process.env.GITHUB_TOKEN;
    console.log(url)
    console.log(TOKEN)
    var options = {
      url: url,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'request'
      },
      method: 'GET'
    };
    request(options, function (error, res, body) {
      console.log(res.statusCode)
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(res.statusCode);
      }
    });
  });
}

function parsePom(pom: string) {
  return new Promise(function (resolve, reject) {
    pomParser.parse(pom, async function (err: string, pomResponse: { pomXml: string; pomObject: any; }) {
      if (err) {
        console.log("ERROR: " + err);
        reject(err);
      } else {
        resolve(pomResponse.pomObject);
      }
    });
  });
}

function checkIfPrApproved(events: any, context: any, validations: { isConflictResolved: boolean, isVersionIncremented: boolean, wasPrApproved: boolean, isConflictInNonVersionFile: boolean }) {
  return new Promise(function (resolve) {
    let eventCount = 0;
    events.data.forEach(event => {
      if (event["type"] === "PullRequestReviewEvent" && event["payload"]["review"]["id"] === context.payload.review.id) {
        eventCount += 1;
        if (eventCount === 2) {
          if (event["payload"]["review"]["state"] === "approved") {
            validations.wasPrApproved = true;
            console.log("PR was approved earlier");
            resolve(validations.wasPrApproved);
          }
        }
      }
    });
    if(validations.wasPrApproved !== true) {
      console.log("PR was not approved earlier");
      validations.wasPrApproved = false;
      resolve(validations.wasPrApproved);
    }
  });
};

function createPullRequestReview(owner: string, repo: string, pullRequestNumber: Number, requestBody: string) {
  return new Promise(function (resolve, reject) {
    let url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/reviews`;
    console.log(url);
    const TOKEN = process.env.GITHUB_TOKEN;
    var options = {
      url: url,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'PostmanRuntime/7.32.3',
        'Accept': '*/*'
      },
      method: 'POST',
      body: JSON.stringify({
        "body": requestBody,
        "event": "APPROVE"
      })
    };
    request(options, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(res.statusCode);
      }
    });
  }).catch((error) => {
    console.log(error);
  });
}
