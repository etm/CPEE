require ::File.dirname(__FILE__) + '/MarkUS_V3.0'
require 'pp'
require 'parsedate'

class MonitorGET < Riddl::Implementation
  include MarkUSModule
  include ParseDate

  def response
    pp "MonitorGET, r0=#{@r[0]}, p0=#{@p[0].value}"
    $monitor_log ||= {}
    @__markus_indent = true;
    since = Time.local(*(parsedate(@p[0].value)))
    Riddl::Parameter::Complex.new("file","text/xml") do
      log_ do
        $monitor_log.each do |res, log|
          log.each do |line|
            if Time.local(*(parsedate(line[:stamp]))) > since
              entry_ :stamp => line[:stamp], :type => line[:type], :details => line[:details]
            end
          end
        end
      end
    end
  end
end

class MonitorPOST < Riddl::Implementation
  def response
    pp "MonitorPOST, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}, p2=#{@p[2].value}"
    $monitor_actpos ||= {}
    $monitor_log ||= {}
    $monitor_log[@r[0]] ||=[]
    $monitor_log[@r[0]].push({:stamp => @p[0].value, :type => @p[1].value, :details => @p[2].value})
    if /position=\[(.*)\]; passthrough=.*/.match(@p[2].value)
      $monitor_actpos[@r[0]] = /position=\[(.*)\]; passthrough=.*/.match(@p[2].value)[1]
    end
    nil
  end
end

class MonitorPosGET < Riddl::Implementation
  def response
    pp "MonitorPosGET, r0=#{@r[0]}"
    $monitor_actpos ||= {}
    pos = $monitor_actpos[@r[0]] ? $monitor_actpos[@r[0]] : "-1"
    Riddl::Parameter::Simple.new("pos", pos)
  end
end