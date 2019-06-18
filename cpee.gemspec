Gem::Specification.new do |s|
  s.name             = "cpee"
  s.version          = "1.4.28"
  s.platform         = Gem::Platform::RUBY
  s.license          = "LGPL-3.0"
  s.summary          = "Preliminary release of cloud process execution engine (cpee). If you just need workflow execution, without a rest/xmpp service exposing it, then use WEEL"

  s.description      = "see http://cpee.org"

  s.files            = Dir['{example/**/*,server/**/*,tools/**/*,lib/**/*,cockpit/**/*,contrib/logo*,contrib/Screen*,log/**/*}'] - Dir['{server/instances/**/*,cockpit/js_libs/**/*,log/logs/**/*}'] + %w(COPYING FEATURES INSTALL Rakefile cpee.gemspec README AUTHORS)
  s.require_path     = 'lib'
  s.extra_rdoc_files = ['README']
  s.bindir           = 'tools'
  s.executables      = ['cpee']
  s.test_files       = Dir['{test/*,test/*/tc_*.rb}']

  s.required_ruby_version = '>=2.3.0'

  s.authors          = ['Juergen eTM Mangler','Ralph Vigne','Gerhard Stuermer','Florian Stertz']

  s.email            = 'juergen.mangler@gmail.com'
  s.homepage         = 'http://cpee.org/'

  s.add_runtime_dependency 'riddl', '~> 0.99'
  s.add_runtime_dependency 'weel', '~> 1.99'
  s.add_runtime_dependency 'savon', '~> 2'
  s.add_runtime_dependency 'highline', '~> 1.6'
  s.add_runtime_dependency 'json', '~>2.1'
  s.add_runtime_dependency 'rubyzip', '~>1.2'
end
