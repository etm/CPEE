# 
# To change this template, choose Tools | Templates
# and open the template in the editor.
# 

require 'rake'
require 'rake/testtask'
require 'rake/rdoctask'

puts "The following test-files will be used ... "
puts "="*50
FileList['test/basic/tc_*.rb', 
         'test/wfp_basic/tc_*.rb',
         'test/wfp_iteration/tc_*.rb',
         'test/wfp_state_based/tc_*.rb',
         'test/wfp_adv_branching/tc_*.rb'].each do |f|
  puts f
end
puts "="*50

Rake::TestTask.new do |t|
    t.libs << "test"
    t.test_files = FileList['test/basic/tc_*.rb', 
                            'test/wfp_basic/tc_*.rb',
                            'test/wfp_iteration/tc_*.rb',
                            'test/wfp_state_based/tc_*.rb',
                            'test/wfp_adv_branching/tc_*.rb']
#    t.verbose = true
  end


