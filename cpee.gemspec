Gem::Specification.new do |s|
  s.name             = "cpee"
  s.version          = "2.1.98"
  s.platform         = Gem::Platform::RUBY
  s.license          = "LGPL-3.0-or-later"
  s.summary          = "The cloud process execution engine (cpee.org). If you just need workflow execution, without a rest service exposing it, then use WEEL."

  s.description      = "see http://cpee.org"

  s.files            = Dir['{example/**/*,server/**/*,tools/**/*,tools/archive,lib/**/*,cockpit/**/*,cockpit/templates/.templates.xml,cockpit/templates/.transformations.xml,cockpit/templates/.Signavio.xml,cockpit/templates/.CPEE.xml,cockpit/*.html,cockpit/themes/*/*,cockpit/themes/*/*/*,contrib/logo*,contrib/Screen*,contrib/transform.rb}'] - Dir['{server/instances/**/*,server/executionhandlers/rust/**/*,cockpit/js_libs/**/*,server/redis*}'] + %w(COPYING FEATURES.md INSTALL.md Rakefile cpee.gemspec README.md AUTHORS)
  s.require_path     = 'lib'
  s.extra_rdoc_files = ['README.md']
  s.bindir           = 'tools'
  s.executables      = ['cpee']
  s.test_files       = Dir['{test/*,test/*/tc_*.rb}']

  s.required_ruby_version = '>=2.7.0'

  s.authors          = ['Juergen eTM Mangler','Ralph Vigne','Gerhard Stuermer']

  s.email            = 'juergen.mangler@gmail.com'
  s.homepage         = 'http://cpee.org/'

  s.add_runtime_dependency 'riddl', '~> 1.0'
  s.add_runtime_dependency 'weel', '~> 1.99', '>= 1.99.126'
  s.add_runtime_dependency 'highline', '~> 2.0'
  s.add_runtime_dependency 'redis', '~> 5.0'
  s.add_runtime_dependency 'rubyzip', '~>2'
  s.add_runtime_dependency 'charlock_holmes', '~>0'
  s.add_runtime_dependency 'mimemagic', '~>0'
  s.add_runtime_dependency 'get_process_mem', '~>0.2'
  s.add_runtime_dependency 'webrick', '~>1.7'
  s.add_runtime_dependency 'cpee-eval-ruby', '~> 1.0', '>= 1.0.4'
  s.add_runtime_dependency 'by', '~> 1.1', '>= 1.1.0'
end
