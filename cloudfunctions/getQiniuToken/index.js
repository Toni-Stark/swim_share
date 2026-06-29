const cloud = require('wx-server-sdk');
const qiniu = require('qiniu');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const AK = 'bURdpoAj31gti9BxiRjZeSn_5H3yWRmGhahLov7Z';
const SK = '8Gwg_AHN6SXxCXXu_m1LzMiSLWfqcSm5SPBFRTH3';
const BUCKET = 'swim-statics';

const mac = new qiniu.auth.digest.Mac(AK, SK);

exports.main = async (event, context) => {
  try {
    const { key } = event || {};
    const options = {
      scope: key ? `${BUCKET}:${key}` : BUCKET,
      insertOnly: 0,
      expires: 600,
      returnBody: '{"key":"$(key)","hash":"$(etag)"}'
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const token = putPolicy.uploadToken(mac);

    return {
      code: 0,
      message: 'success',
      data: { token }
    };
  } catch (e) {
    return {
      code: -1,
      message: '生成凭证失败',
      data: null
    };
  }
};
