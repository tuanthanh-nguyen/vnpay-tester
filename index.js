const crypto = require('node:crypto')
const fs = require('node:fs')
const assert = require('node:assert')
const axios = require('axios')

const PRIVATE_KEY_RSA = fs.readFileSync('./vnpay_private_key_prd.pem')

const requestId = generateRandomString(8)
const requestTime = '25092023000000'
const ewMobile = '0965338450'
const partnerId = '1234'
const ewCustomerName = 'Nguyễn Văn A'
const ewCustomerId = '123456789'
const otp = '123456'

run()

async function run() {
    const data_link_request = await getdDataLinkRequest(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId)
    assert(data_link_request !== null)
    assert(data_link_request.code === '00')
    assert(typeof data_link_request?.data?.confirmId === 'string')
    console.log(data_link_request)

    // get confirmID
    const confirmId = data_link_request.data.confirmId

    const data_link_confirm = await getdDataLinkConfirm(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId, confirmId, otp)
    assert(data_link_confirm !== null)
    assert(data_link_confirm.code === '00')
    assert(typeof data_link_confirm?.data?.ewAccNo === 'string')
    console.log(data_link_confirm)
}

async function getdDataLinkConfirm(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId, confirmId, otp) {
    return axios.post(
        'https://vnticket.vnpaytest.vn/ew-ic-api/ecosystem/ewallet/link-confirm',
        {
            requestId,
            requestTime,
            ewMobile,
            partnerId,
            ewCustomerName,
            ewCustomerId,
            confirmId,
            otp,
            signature: vnpay_signature_link_confirm(requestId, requestTime, ewMobile, confirmId, otp),
        },
        {
            headers: {
                'app-id': 'SDK_VNTAXI_EXT_EMDDI',
            }
        }
    ).then(res => res.data).catch(_ => null)
}
async function getdDataLinkRequest(requestId, requestTime, ewMobile, partnerId, ewCustomerName, ewCustomerId) {
    return axios.post(
        'https://vnticket.vnpaytest.vn/ew-ic-api/ecosystem/ewallet/link-request',
        {
            requestId,
            requestTime,
            ewMobile,
            partnerId,
            ewCustomerName,
            ewCustomerId,
            signature: vnpay_signature_link_request(requestId, requestTime, ewMobile),
        },
        {
            headers: {
                'app-id': 'SDK_VNTAXI_EXT_EMDDI',
            }
        }
    ).then(res => res.data).catch(_ => null)
}

function vnpay_signature_link_request(r_id, r_time, e_m) {
    const s = `${r_id}${r_time}${e_m}`
    const sign = crypto.createSign('SHA256')
    sign.write(s)
    sign.end()
    const signature = sign.sign(PRIVATE_KEY_RSA, 'base64')
    return signature.toString('base64')
}

function vnpay_signature_link_confirm(r_id, r_time, e_m, confirm_id, otp) {
    const s = `${r_id}${r_time}${e_m}${confirm_id}${otp}`
    const sign = crypto.createSign('SHA256')
    sign.write(s)
    sign.end()
    const signature = sign.sign(PRIVATE_KEY_RSA, 'base64')
    return signature.toString('base64')
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
  }

  return randomString;
}
