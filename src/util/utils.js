let inc = 0xFFF;

module.exports.genSnowflake = function(){
    inc++;
    if(inc > 0xFFF) inc = 0;
    let first = BigInt(Date.now()).toString(2);
    let second = "1111111111";
    let third = inc.toString(2).padStart(12, "0");
    return BigInt("0b"+first+second+third).toString();
}