# Renders OG thumbnails (1200x630) from _generator-template.html via headless Chrome.
# Usage: powershell -File generate-og.ps1

$root = 'C:\Users\elite\elite-dental-force-website'
$tplDir = Join-Path $root 'images\blog\og-templates'
$tpl = Get-Content (Join-Path $tplDir '_generator-template.html') -Raw
$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

$specs = @(
  @{ out = 'images\og-blog.png';            cat = 'Resource Hub';         title = 'Dental Revenue <em>Intelligence</em> Blog';        sub = 'Expert insights on billing AI, eligibility verification, claim denials, and practice revenue.'; right = 'Elite Dental Force Blog' },
  @{ out = 'images\og-webinars.png';        cat = 'Live Learning';        title = 'EDF <em>Webinars</em>';                             sub = 'Live sessions on clean claims, eligibility intelligence, and revenue recovery for dental teams.'; right = 'Elite Dental Force Webinars' },
  @{ out = 'images\og-podcast.png';         cat = 'Expert Conversations'; title = 'The EDF <em>Podcast</em>';                          sub = 'Conversations on the future of dental revenue intelligence.'; right = 'Elite Dental Force Podcast' },
  @{ out = 'images\og-news.png';            cat = 'Company Updates';      title = 'Elite Dental Force <em>News</em>';                  sub = 'Product launches, partnerships, and company milestones.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-resources.png';       cat = 'Resource Hub';         title = 'Insights for <em>Revenue Excellence</em>';          sub = 'Blogs, webinars, podcasts, and news from the EDiFi team.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-partners.png';        cat = 'Partnerships';         title = 'Partner with <em>Elite Dental Force</em>';          sub = 'Technology, integration, and affiliate partnerships that grow dental revenue.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-contact.png';         cat = 'Talk to Our Team';     title = 'Contact <em>Elite Dental Force</em>';               sub = 'Sales, support, and partnership inquiries. We respond within one business day.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-demo.png';            cat = 'Product Walkthrough';  title = 'See <em>EDiFi</em> in Action';                      sub = 'Book a 30 minute walkthrough of the dental revenue intelligence platform.'; right = 'Book a Demo' },
  @{ out = 'images\og-security.png';        cat = 'Security';             title = 'Enterprise Grade <em>Security</em>';                sub = 'HIPAA aligned infrastructure protecting patient data at every layer.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-faq.png';             cat = 'Questions Answered';   title = 'Frequently Asked <em>Questions</em>';               sub = 'Everything offices ask about EDiFi, onboarding, and pricing.'; right = 'Elite Dental Force' },
  @{ out = 'images\og-investors.png';       cat = 'Investor Relations';   title = 'Invest in Dental <em>Revenue Intelligence</em>';    sub = 'AI infrastructure for the dental economy. 500 offices on the waitlist.'; right = 'Elite Dental Force' },
  @{ out = 'images\blog\og-proactive-ai.png'; cat = 'AI and Automation';  title = 'Proactive AI for <em>Dental Practices</em>';        sub = 'Shift from reactive billing cleanup to proactive revenue protection.'; right = 'Elite Dental Force Blog' }
)

$tmp = Join-Path $tplDir '_render-tmp.html'
$tmpUrl = 'file:///' + ($tmp.Replace('\', '/'))

foreach ($s in $specs) {
  $html = $tpl.Replace('{{CATEGORY}}', $s.cat).Replace('{{TITLE}}', $s.title).Replace('{{SUBTITLE}}', $s.sub).Replace('{{RIGHT}}', $s.right)
  Set-Content $tmp $html -NoNewline -Encoding UTF8
  $outPath = Join-Path $root $s.out
  & $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="$outPath" $tmpUrl 2>$null | Out-Null
  $name = Split-Path $outPath -Leaf
  if (Test-Path $outPath) {
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Output "$name OK ($kb KB)"
  } else {
    Write-Output "$name FAILED"
  }
}

if (Test-Path $tmp) { Remove-Item $tmp }
