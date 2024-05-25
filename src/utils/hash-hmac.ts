const crypto = require("crypto");

export const hashHmac = (data: string | any) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(data)
    .digest("hex");
};
