# espocrm-pollingsignals
Polling Signals Module for EspoCRM

## Since EspoCRM 8 

To make PollingsSignals work in a portal configuration, add a rewrite rule to your Apache configuration:

````apache2
        RewriteEngine On
        RewriteRule "/api/v1/.*/PollingSignals/(.*)"    "/api/v1/PollingSignals/$1"     [L]
`````



