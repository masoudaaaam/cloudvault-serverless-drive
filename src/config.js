const appOrigin = window.location.origin;

export const awsConfig = {
  region: "eu-north-1",
  userPoolId: "eu-north-1_Q9oJp33vp",
  clientId: "sfnrjrebscdd5oql6o3hfk2ko",
  cognitoDomain: "https://eu-north-1q9ojp33vp.auth.eu-north-1.amazoncognito.com",
  redirectUri: appOrigin,
  logoutUri: appOrigin,
  apiBaseUrl: "https://kpk00n0sk5.execute-api.eu-north-1.amazonaws.com"
};
