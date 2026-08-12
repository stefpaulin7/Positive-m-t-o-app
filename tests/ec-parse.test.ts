/**
 * Test de non-régression du parseur XML "citypage_weather" d'Environnement
 * Canada, à partir d'un exemple XML représentatif du format documenté.
 * Comme le réseau vers dd.weather.gc.ca n'est pas toujours disponible en CI,
 * ce test s'appuie sur une fixture locale plutôt que sur un appel réseau réel.
 *
 * Exécution : npm test
 */
import assert from "node:assert/strict";
import { parseCitypageWeather } from "../src/lib/ec/parse";

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<siteData>
  <location>
    <name code="s0000635" lat="45.47" lon="-73.74">Montréal</name>
    <province code="QC">Québec</province>
  </location>
  <currentConditions>
    <station code="WSK" lat="45.47" lon="-73.74">Montréal Trudeau Intl</station>
    <dateTime zone="UTC" name="observation"><textSummary>12 août 2026 18:00 UTC</textSummary></dateTime>
    <condition>Généralement nuageux</condition>
    <iconCode format="gif">03</iconCode>
    <temperature units="C">22.4</temperature>
    <dewpoint units="C">15.1</dewpoint>
    <pressure units="kPa" tendency="falling">101.2</pressure>
    <visibility units="km">24.1</visibility>
    <relativeHumidity units="%">61</relativeHumidity>
    <wind><speed units="km/h">18</speed><gust units="km/h">32</gust><direction>SO</direction></wind>
  </currentConditions>
  <forecastGroup>
    <forecast>
      <period textForecastName="Aujourd'hui">Aujourd'hui</period>
      <textSummary>Averses en après-midi. Risque d'orage.</textSummary>
      <abbreviatedForecast>
        <iconCode>10</iconCode>
        <pop units="%">60</pop>
        <textSummary>Averses</textSummary>
      </abbreviatedForecast>
      <temperatures>
        <temperature class="high" units="C">25</temperature>
      </temperatures>
      <winds><textSummary>SO 20 km/h</textSummary></winds>
      <uv category="modéré"><index>5</index></uv>
    </forecast>
    <forecast>
      <period textForecastName="Ce soir">Ce soir</period>
      <textSummary>Dégagé en soirée.</textSummary>
      <abbreviatedForecast>
        <iconCode>30</iconCode>
        <pop units="%">10</pop>
        <textSummary>Dégagé</textSummary>
      </abbreviatedForecast>
      <temperatures>
        <temperature class="low" units="C">16</temperature>
      </temperatures>
    </forecast>
  </forecastGroup>
  <hourlyForecastGroup>
    <hourlyForecast dateTimeUTC="20260812T190000Z">
      <condition>Averses</condition>
      <iconCode>10</iconCode>
      <temperature units="C">23</temperature>
      <lop units="%">50</lop>
    </hourlyForecast>
  </hourlyForecastGroup>
  <riseSet>
    <dateTime zone="UTC" name="sunrise"><textSummary>10:45 UTC</textSummary></dateTime>
    <dateTime zone="UTC" name="sunset"><textSummary>00:15 UTC</textSummary></dateTime>
  </riseSet>
  <warnings>
    <event type="watch" priority="high" description="Veille d'orages violents en vigueur" url="https://weather.gc.ca/warnings/index_f.html" />
  </warnings>
</siteData>`;

const result = parseCitypageWeather(sampleXml);

assert.equal(result.location.province, "QC");
assert.equal(result.current.temperatureC, 22.4);
assert.equal(result.current.windDirection, "SO");
assert.equal(result.daily.length, 2);
assert.equal(result.daily[0].precipProbabilityPct, 60);
assert.equal(result.daily[0].sunshineChancePct, 40, "100 - 60 = 40 (chance de soleil, pas de pluie)");
assert.equal(result.daily[1].sunshineChancePct, 90, "100 - 10 = 90");
assert.equal(result.daily[1].isNight, true, "'Ce soir' doit être détecté comme une période de nuit");
assert.equal(result.hourly.length, 1);
assert.equal(result.hourly[0].sunshineChancePct, 50);
assert.equal(result.alerts.length, 1);
assert.equal(result.alerts[0].type, "watch");
assert.equal(result.riseSet.sunrise, "10:45 UTC");

console.log("ec-parse.test.ts : tous les tests sont passés.");
