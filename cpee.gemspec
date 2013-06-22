Gem::Specification.new do |s|
  s.name             = "cpee"
  s.version          = "1.3.99"
  s.platform         = Gem::Platform::RUBY
  s.summary          = "preliminary release of cloud process execution engine (cpee)"

  s.description = <<-EOF
BEWARE:

ADVENTURE & CPEE stuff is not clearly seperated right now.
Later on we will branch out into distinct cpee and cpee-adventure 
packages with different licences. 

For CPEE/WEE specific information see http://cpee.org
For ADVENTURE specific information see http://fp7-adventure.eu
EOF

  s.files            = Dir['{example/**/*,server/**/*,cockpit/**/*,contrib/logo*,contrib/wee*,contrib/Screen*}'] + %w(COPYING FEATURES INSTALL Rakefile cpee.gemspec README AUTHORS)
  s.extra_rdoc_files = ['README']
  s.test_files       = Dir['{test/*,test/*/tc_*.rb}']

  s.authors          = ['Juergen eTM Mangler','Ralph Vigne','Gerhard Stuermer']
  s.email            = 'juergen.mangler@gmail.com'
  s.homepage         = 'http://www.wst.univie.ac.at/workgroups/wee/'

  s.add_runtime_dependency 'riddl'
  s.add_runtime_dependency 'weel'
  s.add_runtime_dependency 'savon'
end
