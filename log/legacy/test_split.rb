require 'yaml'
require 'pp'

#{{{
yaml1 = <<-END
event:
  cpee:lifecycle:transition: activity/receiving
  list:
    data_receiver:
    - message:
        mimetype: application/json
        content:
        - ID: ns=2;s=/Channel/ProgramInfo/actBlock
          meta:
            StatusCodea: Good
        - ID: ns=2;s=/Channel/Spindle/driveLoad
          meta:
            StatusCodeb: Good
    - message:
        mimetype: application/xml
        content:
        - ID: ns=2;s=/Channel/ProgramInfo/actBlock
          meta:
            StatusCodec: Good
        - ID: ns=2;s=/Channel/Spindle/driveLoad
          meta:
            StatusCoded: Good
  time:timestamp: '2018-05-03T14:08:14+02:00'
END
#}}}
#{{{
yaml2 = <<-END
event:
  trace:id: '160'
  concept:name: Fetch
  concept:endpoint: https://centurio.work/data/mt45/queue/48623a67-7b67-4902-b5d4-7243f1d090e2/push
  id:id: a1
  lifecycle:transition: unknown
  cpee:lifecycle:transition: activity/receiving
  list:
    data_receiver:
    - message:
        mimetype: application/json
        content:
        - ID: ns=2;s=/Channel/ProgramInfo/actBlock
          source: opcua
          name: Program/actBlock
          description: Current part program block.
          path: "/Object/Sinumerik/Channel/ProgramInfo/actBlock"
          value:
          timestamp: '2018-05-03 14:16:55.241000'
          meta:
            StatusCode: Good
            ServerTimestamp: '2018-05-03 12:16:55.318853'
            VariantType: VariantType.String
            ClientHandle: '212'
        - ID: ns=2;s=/Channel/Spindle/driveLoad
          source: opcua
          name: Spindle/driveLoad
          description: Load
          path: "/Object/Sinumerik/Channel/Spindle/driveLoad"
          value: 0.030517578125
          timestamp: '2018-05-03 14:16:55.241000'
          meta:
            StatusCode: Good
            ServerTimestamp: '2018-05-03 12:16:55.318853'
            VariantType: VariantType.Double
            ClientHandle: '217'
        - ID: ns=2;s=/Channel/MachineAxis/aaLeadP[u1,3]
          source: opcua
          name: Axis/Z/aaLeadP
          description: ''
          path: "/Object/Sinumerik/Channel/MachineAxis/aaLeadP[u1,3]"
          value: 162.51611
          timestamp: '2018-05-03 14:16:55.241000'
          meta:
            StatusCode: Good
            ServerTimestamp: '2018-05-03 12:16:55.318853'
            VariantType: VariantType.Double
            ClientHandle: '222'
        - ID: ns=2;s=/Channel/MachineAxis/aaTorque[u1,1]
          source: opcua
          name: Axis/X/aaTorque
          description: ''
          path: "/Object/Sinumerik/Channel/MachineAxis/aaTorque[u1,1]"
          value: -2.072
          timestamp: '2018-05-03 14:16:55.241000'
          meta:
            StatusCode: Good
            ServerTimestamp: '2018-05-03 12:16:55.318853'
            VariantType: VariantType.Double
            ClientHandle: '223'
        - ID: ns=2;s=/Channel/MachineAxis/aaTorque[u1,2]
          source: opcua
          name: Axis/Y/aaTorque
          description: ''
          path: "/Object/Sinumerik/Channel/MachineAxis/aaTorque[u1,2]"
          value: 0.107
          timestamp: '2018-05-03 14:16:55.241000'
          meta:
            StatusCode: Good
            ServerTimestamp: '2018-05-03 12:16:55.318853'
            VariantType: VariantType.Double
            ClientHandle: '224'
  time:timestamp: '2018-05-03T14:08:14+02:00'
END
#}}}

def traverse(node,paths=[[]],anal=[],depth=0)
  cpath = paths.last.dup
  case node
    when Hash
      node.each do |k,v|
        unless cpath.empty?
          paths.last << [] unless paths.last.last.class == Array
          paths << cpath.dup
        end
        paths.last << k
        traverse(v,paths,anal,depth+1)
      end
    when Array
      node.each_with_index do |e,i|
        posanal = [depth,paths.length,nil,[]]
        anal << posanal

        unless cpath.empty?
          paths.last << [] unless paths.last.last.class == Array
          paths << cpath.dup
        end
        paths.last << i
        traverse(e,paths,posanal.last,depth+1)
        dp = cpath.dup
        dp << [] unless dp.last.class == Array
        paths << dp unless paths.include?(dp)

        posanal[2] = paths.length - 1
      end
    else
      paths.last << [] unless paths.last.last.class == Array
  end
end

def duplicate(doc,paths,anal)
  res = []
  deep_cloned = Marshal::load(Marshal.dump(paths))
  anal.each_with_index do |e,ei|
    local_cloned = Marshal::load(Marshal.dump(deep_cloned))
    anal.select{ |a| a == e }.each do |a|
      (a[1]).upto(a[2]) do |i|
        local_cloned[i].last << a[0]
      end
    end
    anal.reject{ |a| a == e }.each do |a|
      (a[1]).upto(a[2]) do |i|
        local_cloned[i] = nil
      end
    end
    if !e[3]&.empty?
      e[3..-1].each_with_index do |ee,eei|
        ret = duplicate(doc,local_cloned,ee)
        res.concat ret
      end
    else
      res << extract_from_doc(doc,local_cloned.compact)
    end
  end
  res
end

def extract_from_doc(doc,paths)
  ret = {}
  paths.each do |p|
    next if p.nil?
    a = doc.dig(*p[0..-2])

    py = p.dup
    p[-1].each_with_index do |px,i|
      py.delete_at(px-i)
    end

    x1 = py[-2]
    x2 = py[0..-3]
    where = ret
    if x2.any?
      where = ret.dig(*x2)
    end
    where[x1] = {}

    unless a.class == Hash || a.class == Array
      where[x1] = a
    end
  end
  ret
end

aaa = Time.now
doc = YAML.load(yaml2)

paths = [[]]
anal  = []
traverse(doc,paths,anal)
anal.uniq!

res = duplicate(doc,paths,anal)

res.each do |r|
  pp r
end

p Time.now.to_f-aaa.to_f
