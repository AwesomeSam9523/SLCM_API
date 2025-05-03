import express from 'express';

function successJson(
  res: express.Response,
  data: object | undefined = undefined,
) {
  res.status(200).json({
    success: true,
    data,
  });
}

function errorJson(res: express.Response, errorCode: number, message: string) {
  res.status(errorCode).json({
    success: false,
    message,
  });
}

export { successJson, errorJson };
