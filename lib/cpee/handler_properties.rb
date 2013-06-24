class PropertiesHandler < Riddl::Utils::Properties::HandlerBase
  def sync
    case @property
      when 'handlerwrapper'
        @data.unserialize_handlerwrapper!
        @data.notify('properties/handlerwrapper/change')
      when 'description'
        @data.unserialize_description!
        @data.notify('properties/description/change')
      when 'endpoints'
        @data.unserialize_endpoints!
        @data.notify('properties/endpoints/change')
      when 'dataelements'
        @data.unserialize_dataelements!
        @data.notify('properties/dataelements/change')
      when 'positions'  
        @data.unserialize_positions!
        @data.notify('properties/position/change')
      when 'state'  
        @data.unserialize_state!
      else
        nil
    end
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end
