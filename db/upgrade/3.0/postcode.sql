SELECT "Updating timezone/DST for postcodes in BC, Alberta, NWT, Saskatchewan and Manitoba" AS "";

UPDATE postcode
JOIN region ON postcode.region_id = region.id
SET
  timezone_offset = IF(
    region.name IN("Yukon", "British Columbia") AND timezone_offset = -8,
    -7, -- permanent PDT
    IF(
      region.name IN("British Columbia", "Alberta", "Northwest Territories", "Saskatchewan")
      AND timezone_offset = -7
      AND daylight_savings = 1,
      -6, -- permanent MDT
      IF(
        region.name IN("Saskatchewan", "Manitoba")
        AND timezone_offset = -6
        AND daylight_savings = 1,
        -5, -- permanent CDT
        timezone_offset -- leave it unchanged
      )
    )
  ),
  daylight_savings = 0
WHERE region.name IN("Yukon", "British Columbia", "Alberta", "Northwest Territories", "Saskatchewan", "Manitoba")
AND timezone_offset IN (-8, -7, -6)
AND daylight_savings = 1;
