import * as fs from 'fs';

import { NextApiRequest, NextApiResponse } from "next"
import { SignOptions, VerifyOptions, sign, verify } from 'jsonwebtoken';

import { join } from 'path';

//import * as mkdirp from "mkdirp";



function get(res: NextApiResponse) {
  res.status(200).json({
    hi: "hi"
  })
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { action } = req.body

    if (action == "createconfig") {
      try {

        const { owner } = req.body
        const { accesstoken } = req.body
        const path = join(__dirname, "../../../../config")
        const file = join(__dirname, "../../../../config/conf.json")

        var configuration = { owner: `${owner}`, accesstoken: `${accesstoken}`, candyMachineID: "", rpcHost: "", network: "" }
        await fs.mkdir(path, { recursive: true }, err => { });
        fs.writeFile(file, JSON.stringify(configuration, null, '\t'), function (err) {
          if (err) {
            res.status(500).json({ message: 'error', })
            return
          }
          return res.status(200).json({
            message: "Successful"
          })
        });
      } catch (e) {
        res.status(500).json({ message: 'error', })
        return
      }

    } else if (action == "getconfig") {
      try {
        const file = join(__dirname, "../../../../config/conf.json")
        fs.readFile(file, 'utf-8', function (err, data) {

          // Display the file content
          const config: any = data;

          return res.status(200).json({
            message: config
          })
        })
      } catch (e) {
        res.status(500).json({ message: 'error', })
        return
      }
    } else if (action == "updateconfig") {
      try {
        const authHeader: any = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        const { cmi } = req.body
        const { net } = req.body
        const { rpc } = req.body
        const file = join(__dirname, "../../../../config/conf.json")
        fs.readFile(file, 'utf-8', function (err, data) {

          // Display the file content
          const config: any = JSON.parse(data);
          verify(token, config["accesstoken"], (err: any, user: any) => {
            if (err) {
              res.status(500).json({ message: err, })
              return
            } else {
              if (`user ${user["owner"] == config["owner"]}`) {
                if (cmi != '') {
                  config["candyMachineID"] = cmi;
                }
                if (net != '') {
                  config["network"] = net;
                }
                if (rpc != '') {
                  config["rpcHost"] = rpc;
                }
                fs.writeFile(file, JSON.stringify(config, null, '\t'), function (err) {
                  if (err) {
                    res.status(500).json({ message: 'error', })
                    return
                  }
                  return res.status(200).json({
                    message: "Successful"
                  })
                });
              } else {
                res.status(500).json({ message: 'Owner Mismatch', })
                return
              }
            }
          })

        })
      } catch (e) {
        res.status(500).json({ message: e, })
        return
      }
    }

  } catch (err) {
    //console.error(err);
    res.status(500).json({ message: 'error', })
    return
  }
}

export default async function handler(
  req: NextApiRequest,
  res: any
  //res: NextApiResponse<TransactionGetResponse | TransactionOutputData | ErrorOutput>
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}