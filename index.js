const express = require('express')
const app = express()
var rp = require('request-promise');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/vehicles/:modelYear/:manufacturer/:model', function(req, res) {
  const { modelYear, manufacturer, model } = req.params
  const withRating = req.query.withRating
  rp(`https://one.nhtsa.gov/webapi/api/SafetyRatings/modelyear/${modelYear}/make/${manufacturer}/model/${model}?format=json`)
  .then( res => JSON.parse(res) )
  .then( response => {
    if (withRating === 'true') {
      var ratings = getSafetyRatings(response.Results)
                    .then(carsInfo => response.Results.map((car,index) => {
                      car.CrashRating = carsInfo[index]
                      return car
                    }))
                    .then(carsInfo => res.send( JSON.stringify({ Count: response.Count, Results: carsInfo }) ))
    } else {
        res.send(JSON.stringify({ Count: response.Count, Results: response.Results }))
    }
  })
  .catch(err => res.send( JSON.stringify({ Count: 0, Results: [] }) ))
})


app.post('/vehicles', function(req, res) {
  const { modelYear, manufacturer, model } = req.body
  rp(`https://one.nhtsa.gov/webapi/api/SafetyRatings/modelyear/${modelYear}/make/${manufacturer}/model/${model}?format=json`)
  .then(response => JSON.parse(response))
  .then(carsInfo => res.send( JSON.stringify({ Count: carsInfo.Count, Results: carsInfo.Results }) ))
  .catch(err => res.send( JSON.stringify({ Count: 0, Results: [] }) ))
})

function getSafetyRatings(cars){
  var promises = cars.map((car,index) =>
    rp(`https://one.nhtsa.gov/webapi/api/SafetyRatings/VehicleId/${car.VehicleId}?format=json`)
  )
  return Promise.all(promises)
  .then(value => {
    return value.map((car => JSON.parse(car).Results[0].OverallRating))
  })
  .catch(err => console.log(err))
}


app.listen(8888, function () {
  console.log('Example app listening on port 8888!')
})
