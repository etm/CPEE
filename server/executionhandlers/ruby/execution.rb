# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'net/ssh'
require 'net/scp'

module CPEE

  module ExecutionHandler

    module Ruby
      BACKEND_INSTANCE = 'instance.rb'
      DSL_TO_DSLX_XSL  = File.expand_path(File.join(__dir__,'dsl_to_dslx.xsl'))
      BACKEND_RUN      = File.expand_path(File.join(__dir__,'backend','run.rb'))
      BACKEND_OPTS     = File.expand_path(File.join(__dir__,'backend','opts.yaml'))
      BACKEND_TEMPLATE = File.expand_path(File.join(__dir__,'backend','instance.template'))

      def self::dslx_to_dsl(dslx,ep) # transpile
        trans = XML::Smart::open_unprotected(ExecutionHandler::Ruby::DSL_TO_DSLX_XSL)
        dslx.transform_with(trans).to_s
      end

      def self::prepare(id,opts) # write result to disk
        FileUtils.rm_rf(Dir.glob(File.join(opts[:instances],id.to_s,'*')) + Dir.glob(File.join(opts[:instances],id.to_s,'.remote')))
        Dir.mkdir(File.join(opts[:instances],id.to_s)) rescue nil
        FileUtils.copy(ExecutionHandler::Ruby::BACKEND_RUN,File.join(opts[:instances],id.to_s))
        dsl = CPEE::Persistence::extract_item(id,opts,'dsl')
        hw = CPEE::Persistence::extract_item(id,opts,'executionhandler')
        endpoints = CPEE::Persistence::extract_list(id,opts,'endpoints')
        dataelements = CPEE::Persistence::extract_list(id,opts,'dataelements')
        attributes = CPEE::Persistence::extract_list(id,opts,'attributes').to_h
        positions = CPEE::Persistence::extract_set(id,opts,'positions')
        positions.map! do |k, v|
          [ k, v, CPEE::Persistence::extract_item(id,opts,File.join('positions',k,'@passthrough')) ]
        end
        iopts = YAML::load_file(ExecutionHandler::Ruby::BACKEND_OPTS)
        iopts[:host] = opts[:host]
        iopts[:url] = opts[:url]
        iopts[:redis_url] = opts[:redis_url]
        iopts[:redis_db] = opts[:redis_db]
        iopts[:workers] = opts[:workers]
        iopts[:executionhandler] = hw
        if attributes.has_key?('remote')
          uri = URI::parse(attributes['remote'])
          iopts[:executionhandlers] = File.join(uri.path,File.basename(opts[:executionhandlers]))
        else
          iopts[:executionhandlers] = opts[:executionhandlers]
          iopts[:global_executionhandlers] = opts[:global_executionhandlers]
        end

        File.open(File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Ruby::BACKEND_OPTS)),'w') do |f|
          YAML::dump(iopts,f)
        end
        template = ERB.new(File.read(ExecutionHandler::Ruby::BACKEND_TEMPLATE), trim_mode: '-')
        res = template.result_with_hash(dsl: dsl, dataelements: dataelements, endpoints: endpoints, positions: positions)
        File.write(File.join(opts[:instances],id.to_s,ExecutionHandler::Ruby::BACKEND_INSTANCE),res)
        if attributes.has_key?('remote')
          uri = URI::parse(attributes['remote'])
          Net::SSH.start(uri.host,uri.user,:keys => [ opts[:ssh_key] ] ) do |ssh|
            ssh.exec!("rm -rf #{File.join(uri.path,id.to_s,'*')}")
            ssh.scp.upload!(File.join(opts[:instances],id.to_s),uri.path,:recursive=>true)
          end
          File.write(File.join(opts[:instances],id.to_s,'.remote'),attributes['remote'])
        end
      end

      def self::run(id,opts)
        if File.exist? File.join(opts[:instances],id.to_s,'.remote')
          uri = URI::parse(File.read(File.join(opts[:instances],id.to_s,'.remote')))
          exe = File.join(uri.path,id.to_s,File.basename(BACKEND_RUN))
          Net::SSH.start(uri.host,uri.user,:keys => [ opts[:ssh_key] ] ) do |ssh|
            ssh.exec!("ruby #{exe} >#{exe}.out 2>#{exe}.err &")
          end
        else
          exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Ruby::BACKEND_RUN))
          pid = Kernel.spawn(opts[:libs_preloaderrun] + ' ' + exe , :pgroup => true, :in => '/dev/null', :out => exe + '.out', :err => exe + '.err')
          Process.detach pid
          File.write(exe + '.pid',pid)
        end
      end

      def self::stop(id,opts) ### return: bool to tell if manually changing redis is necessary
        if File.exist? File.join(opts[:instances],id.to_s,'.remote')
          uri = URI::parse(File.read(File.join(opts[:instances],id.to_s,'.remote')))
          exe = File.join(uri.path,id.to_s,File.basename(BACKEND_RUN))
          Net::SSH.start(uri.host,uri.user,:keys => [ opts[:ssh_key] ] ) do |ssh|
            pid = ssh.exec!("cat #{exe}.pid 2>/dev/null")
            if pid != '' && ssh.exec!("kill -0 #{pid} >/dev/null 2>&1; echo $?").strip == '0'
              ssh.exec!("kill -SIGHUP #{pid}")
              false
            else
              ssh.exec!("rm #{exe}.pid")
              true
            end
          end
        else
          exe = File.join(opts[:instances],id.to_s,File.basename(ExecutionHandler::Ruby::BACKEND_RUN))
          pid = File.read(exe + '.pid') rescue nil
          if pid && (Process.kill(0, pid.to_i) rescue false)
            Process.kill('HUP', pid.to_i) rescue nil
            false
          else # its not running, so clean up
            File.unlink(exe + '.pid') rescue nil
            true
          end
        end
      end
    end

  end

end
